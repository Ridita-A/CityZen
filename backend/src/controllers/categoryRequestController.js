const {
  PendingCategoryRequest,
  Complaint,
  ComplaintImages,
  Category,
  AuthorityCompany,
  AuthorityCompanyCategory,
  ComplaintAssignment,
  User,
  Citizen,
  sequelize,
} = require('../models');
const { Op } = require('sequelize');
const supabase = require('../config/supabase');
const sharp = require('sharp');


const generateImageHash = async (imageBuffer) => {
  try {
    const data = await sharp(imageBuffer)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();
    return data.toString('hex');
  } catch (e) {
    console.error('Hash generation error', e);
    return null;
  }
};

const getHammingDistance = (str1, str2) => {
  if (!str1 || !str2 || str1.length !== str2.length) return 1000;
  let dist = 0;
  for (let i = 0; i < str1.length; i++) {
    if (str1[i] !== str2[i]) dist++;
  }
  return dist;
};

exports.saveDraftComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { title, description, latitude, longitude, citizenUid, categoryLabel, categoryDescription } = req.body;
    const imageFiles = req.files;

    if (!title || !latitude || !longitude || !citizenUid || !categoryLabel || !imageFiles || imageFiles.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Missing required fields or images.' });
    }

    // Ban check    
    const user = await User.findByPk(citizenUid, { include: [{ model: Citizen }] });
    if (user?.Citizen?.isBanned) {
      await t.rollback();
      return res.status(403).json({ message: 'Your account has been banned.', banned: true });
    }

    // Spam check (5+ complaints in 30 mins)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentCount = await Complaint.count({
      where: { citizenUid, createdAt: { [Op.gte]: thirtyMinsAgo } }
    });
    if (recentCount >= 5) {
      await t.rollback();
      return res.status(429).json({ message: 'Too many submissions. Please try again later.' });
    }

    // Image reuse check
    const newComplaintImages = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const bucketName = 'cityzen-media';

    for (const file of imageFiles) {
      const currentHash = await generateImageHash(file.buffer);

      if (currentHash) {
        const previousImages = await ComplaintImages.findAll({
          where: { imageHash: { [Op.ne]: null }, createdAt: { [Op.gte]: thirtyDaysAgo } },
          include: [{ model: Complaint, where: { citizenUid }, attributes: [] }],
        });

        let isReused = false;
        for (const prevImg of previousImages) {
          if (getHammingDistance(currentHash, prevImg.imageHash) <= 12) {
            isReused = true;
            break;
          }
        }

        if (isReused) {
          await t.rollback();
          return res.status(400).json({
            message: 'Please provide a real-time photo of the issue.',
            isImageReused: true,
          });
        }

        newComplaintImages.push({ file, hash: currentHash });
      } else {
        newComplaintImages.push({ file, hash: null });
      }
    }

    // Find or create PendingCategoryRequest (case-insensitive match while pending)
    const normalizedLabel = categoryLabel.trim();
    let categoryRequest = await PendingCategoryRequest.findOne({
      where: {
        categoryLabel: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('categoryLabel')),
          sequelize.fn('LOWER', normalizedLabel)
        ),
        status: 'pending',
      },
    });

    if (!categoryRequest) {
      categoryRequest = await PendingCategoryRequest.create(
        { categoryLabel: normalizedLabel, categoryDescription: categoryDescription || null },
        { transaction: t }
      );
    }

    // Create draft Complaint
    const complaint = await Complaint.create(
      {
        title,
        description,
        latitude,
        longitude,
        citizenUid,
        categoryId: null,
        pendingCategoryRequestId: categoryRequest.id,
        currentStatus: 'draft',
        priorityScore: 0,
      },
      { transaction: t }
    );

    // Upload images to Supabase and create ComplaintImages records
    for (const imgData of newComplaintImages) {
      const filePath = `complaint_images/${complaint.id}_${Date.now()}_${imgData.file.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imgData.file.buffer, { contentType: imgData.file.mimetype, upsert: false });

      if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) throw new Error('Failed to retrieve public URL.');

      await ComplaintImages.create(
        { complaintId: complaint.id, imageURL: publicUrlData.publicUrl, imageHash: imgData.hash },
        { transaction: t }
      );
    }

    await t.commit();
    return res.status(201).json({
      message: 'Draft complaint saved. Pending admin category review.',
      draftComplaintId: complaint.id,
      pendingRequestId: categoryRequest.id,
      categoryLabel: normalizedLabel,
    });
  } catch (error) {
    await t.rollback();
    console.error('Save Draft Complaint Error:', error.message);
    return res.status(500).json({ message: `Failed to save draft: ${error.message}` });
  }
};

// GET /api/category-requests[?status=pending|approved|rejected]
exports.getPendingRequests = async (req, res) => {
  try {
    const status = req.query.status || 'pending';

    const requests = await PendingCategoryRequest.findAll({
      where: { status },
      include: [
        {
          model: Complaint,
          as: 'draftComplaints',
          attributes: ['id', 'title', 'latitude', 'longitude', 'createdAt', 'currentStatus'],
          include: [
            {
              model: ComplaintImages,
              as: 'images',
              attributes: ['id', 'imageURL'],
              limit: 1,
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Enrich each request with counts and a sample signed image
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const plain = req.get({ plain: true });
        plain.draftCount = plain.draftComplaints?.length || 0;

        // Try to sign the first sample image
        const firstImage = plain.draftComplaints?.[0]?.images?.[0];
        if (firstImage?.imageURL) {
          try {
            const url = firstImage.imageURL;
            const parsed = new URL(url);
            const path = parsed.pathname || '';
            const marker = `/cityzen-media/`;
            const idx = path.indexOf(marker);
            const objectPath = idx >= 0 ? path.slice(idx + marker.length) : null;
            if (objectPath) {
              const { data, error } = await supabase.storage
                .from('cityzen-media')
                .createSignedUrl(objectPath, 60 * 60);
              if (!error && data?.signedUrl) {
                firstImage.imageURL = data.signedUrl;
              }
            }
          } catch (_) { /* leave original */ }
        }
        plain.sampleImage = firstImage?.imageURL || null;
        return plain;
      })
    );

    return res.json({ requests: enriched });
  } catch (error) {
    console.error('Get Pending Requests Error:', error.message);
    return res.status(500).json({ message: 'Server error while fetching category requests.' });
  }
};

// PATCH /api/category-requests/:id/approve
// Body: { categoryName: string, authorityIds: number[] }
exports.approveRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { categoryName, authorityIds } = req.body;

    if (!categoryName || !authorityIds || authorityIds.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'categoryName and authorityIds are required.' });
    }

    const categoryRequest = await PendingCategoryRequest.findByPk(id, {
      include: [{ model: Complaint, as: 'draftComplaints' }],
    });

    if (!categoryRequest) {
      await t.rollback();
      return res.status(404).json({ message: 'Category request not found.' });
    }

    if (categoryRequest.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: `Request is already ${categoryRequest.status}.` });
    }

    // 1. Create or find the Category
    const [category] = await Category.findOrCreate({
      where: { name: categoryName.trim() },
      defaults: {
        name: categoryName.trim(),
        description: categoryRequest.categoryDescription || 'New category added via AI detection.'
      },
      transaction: t,
    });

    // 2. Map authority companies to the new category
    let mappedCount = 0;
    for (const authorityId of authorityIds) {
      const company = await AuthorityCompany.findByPk(authorityId);
      if (!company) continue; // skip invalid IDs

      await AuthorityCompanyCategory.findOrCreate({
        where: { authorityCompanyId: authorityId, categoryId: category.id },
        defaults: { authorityCompanyId: authorityId, categoryId: category.id },
        transaction: t,
      });
      mappedCount++;
    }

    // Guard: if none of the provided authority IDs actually exist, fail now
    // than submitting complaints that have no authority to handle them.
    // Auto-reject the request so the citizen is notified via normal polling.
    if (mappedCount === 0) {
      await t.rollback(); // undo Category creation

      const rejectNote = 'No valid authority company could be mapped to this category. Your complaint has been rejected.';
      const rejectT = await sequelize.transaction();
      try {
        const draftComplaints = categoryRequest.draftComplaints || [];
        for (const draft of draftComplaints) {
          await draft.update(
            { currentStatus: 'rejected', statusNotes: rejectNote, pendingCategoryRequestId: null },
            { transaction: rejectT }
          );
        }
        await categoryRequest.update(
          { status: 'rejected', adminRemarks: rejectNote },
          { transaction: rejectT }
        );
        await rejectT.commit();
      } catch (rejectErr) {
        await rejectT.rollback();
        console.error('Auto-reject after zero-authority failure:', rejectErr.message);
      }

      return res.status(422).json({
        message: 'None of the provided authority IDs correspond to existing companies. The category request and all linked draft complaints have been rejected. Citizens will be notified.',
      });
    }

    // 3. Activate all draft complaints under this request
    const draftComplaints = categoryRequest.draftComplaints || [];
    for (const draft of draftComplaints) {
      await draft.update(
        {
          categoryId: category.id,
          currentStatus: 'pending',
          pendingCategoryRequestId: null,
        },
        { transaction: t }
      );

      // Assign only the authority IDs that actually mapped (re-use authorityIds;
      // all invalid ones were skipped above so mappedCount > 0 guarantees at least one)
      for (const authorityId of authorityIds) {
        const company = await AuthorityCompany.findByPk(authorityId);
        if (!company) continue;
        await ComplaintAssignment.create(
          { complaintId: draft.id, authorityCompanyId: authorityId },
          { transaction: t }
        );
      }
    }

    // 4. Mark the request as approved
    await categoryRequest.update(
      { status: 'approved', approvedCategoryId: category.id },
      { transaction: t }
    );

    await t.commit();
    return res.json({
      message: `Category request approved. ${draftComplaints.length} draft complaint(s) are now pending.`,
      categoryId: category.id,
      categoryName: category.name,
      activatedComplaints: draftComplaints.length,
    });
  } catch (error) {
    await t.rollback();
    console.error('Approve Category Request Error:', error.message);
    return res.status(500).json({ message: `Failed to approve request: ${error.message}` });
  }
};

// PATCH /api/category-requests/:id/reject
// Body: { adminRemarks?: string }
exports.rejectRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    const categoryRequest = await PendingCategoryRequest.findByPk(id, {
      include: [{ model: Complaint, as: 'draftComplaints' }],
    });

    if (!categoryRequest) {
      await t.rollback();
      return res.status(404).json({ message: 'Category request not found.' });
    }

    if (categoryRequest.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: `Request is already ${categoryRequest.status}.` });
    }

    const note = adminRemarks || 'Category not recognized or no authority available to handle it.';

    // 1. Reject all linked draft complaints
    const draftComplaints = categoryRequest.draftComplaints || [];
    for (const draft of draftComplaints) {
      await draft.update(
        {
          currentStatus: 'rejected',
          statusNotes: note,
          pendingCategoryRequestId: null,
        },
        { transaction: t }
      );
    }

    // 2. Mark the request as rejected
    await categoryRequest.update(
      { status: 'rejected', adminRemarks: note },
      { transaction: t }
    );

    await t.commit();
    return res.json({
      message: `Category request rejected. ${draftComplaints.length} draft complaint(s) have been rejected.`,
      rejectedComplaints: draftComplaints.length,
    });
  } catch (error) {
    await t.rollback();
    console.error('Reject Category Request Error:', error.message);
    return res.status(500).json({ message: `Failed to reject request: ${error.message}` });
  }
};
