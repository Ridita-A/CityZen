const { Complaint, Category, ComplaintImages, sequelize } = require('../models');
const supabase = require('../config/supabase'); // Import Supabase client

exports.createComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      title,
      description,
      latitude,
      longitude,
      citizenUid,
      categoryId,
    } = req.body;

    const imageFiles = req.files; // Multer makes the uploaded files available here as an array

    if (!title || !latitude || !longitude || !citizenUid || !categoryId || !imageFiles || imageFiles.length === 0) {
      return res.status(400).json({ message: 'Missing required complaint fields or image data.' });
    }

    const complaint = await Complaint.create({
      title,
      description,
      latitude,
      longitude,
      citizenUid,
      categoryId: categoryId,
      currentStatus: 'pending'
    }, { transaction: t });

    // Supabase Storage integration for multiple images
    const bucketName = 'cityzen-media'; // TODO: Replace with your actual Supabase bucket name

    for (const imageFile of imageFiles) {
      const filePath = `complaint_images/${complaint.id}_${Date.now()}_${imageFile.originalname}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imageFile.buffer, {
          contentType: imageFile.mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error(`Supabase upload failed for ${imageFile.originalname}: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData, error: publicUrlError } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (publicUrlError) {
        throw new Error(`Supabase getPublicUrl failed for ${imageFile.originalname}: ${publicUrlError.message}`);
      }
      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error(`Supabase getPublicUrl returned invalid data for ${imageFile.originalname}: ${JSON.stringify(publicUrlData)}`);
      }

      const imageUrl = publicUrlData.publicUrl;

      // Ensure complaint.id is valid before creating ComplaintImages
      if (!complaint.id) {
        throw new Error('Complaint ID is null after creation, cannot link image.');
      }

      await ComplaintImages.create({
        complaintId: complaint.id, // Matches new model casing
        imageURL: imageUrl,        // Matches new model casing
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: 'Complaint created successfully', complaint });

  } catch (error) {
    await t.rollback();
    console.error('Complaint Creation Error:', error.message);
    res.status(500).json({ message: `Complaint creation failed: ${error.message}` });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'description']
    });
    res.json(categories);
  } catch (error) {
    console.error('Get Categories Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching categories.' });
  }
};

// Get all complaints (with optional filtering)
exports.getAllComplaints = async (req, res) => {
  try {
    const { status, categoryId, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (status) where.currentStatus = status;
    if (categoryId) where.categoryId = categoryId;

    const offset = (page - 1) * limit;

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: ComplaintImages,
          as: 'images',
          attributes: ['id', 'imageURL']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      complaints: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get All Complaints Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching complaints.' });
  }
};

// Get complaints by citizen ID
exports.getComplaintsByCitizen = async (req, res) => {
  try {
    const { citizenUid } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const where = { citizenUid };
    if (status) where.currentStatus = status;

    const offset = (page - 1) * limit;

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: ComplaintImages,
          as: 'images',
          attributes: ['id', 'imageURL']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      complaints: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get Complaints by Citizen Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching citizen complaints.' });
  }
};

// Get complaint by ID
exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findByPk(id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'description']
        },
        {
          model: ComplaintImages,
          as: 'images',
          attributes: ['id', 'imageURL']
        }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Get Complaint by ID Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching complaint.' });
  }
};

// Update complaint status (for authorities/admins)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStatus, statusNotes } = req.body;

    if (!currentStatus) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed', 'rejected'];
    if (!validStatuses.includes(currentStatus)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    await complaint.update({
      currentStatus,
      statusNotes: statusNotes || complaint.statusNotes,
      updatedAt: new Date()
    });

    res.json({ message: 'Complaint status updated successfully', complaint });
  } catch (error) {
    console.error('Update Complaint Status Error:', error.message);
    res.status(500).json({ message: 'Server error while updating complaint status.' });
  }
};

// Delete complaint (only by creator or admin)
exports.deleteComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { citizenUid } = req.body;

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    // Verify ownership or admin privilege (should be enforced by middleware in production)
    if (complaint.citizenUid !== citizenUid) {
      return res.status(403).json({ message: 'Not authorized to delete this complaint.' });
    }

    // Delete associated images from Supabase
    const images = await ComplaintImages.findAll({
      where: { complaintId: id }
    });

    const bucketName = 'cityzen-media';
    for (const image of images) {
      try {
        const fileName = image.imageURL.split('/').pop();
        await supabase.storage.from(bucketName).remove([`complaint_images/${id}_${fileName}`]);
      } catch (storageError) {
        console.warn(`Could not delete image from storage: ${storageError.message}`);
      }
    }

    // Delete complaint and associated records (cascade)
    await Complaint.destroy({
      where: { id },
      transaction: t
    });

    await t.commit();
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Delete Complaint Error:', error.message);
    res.status(500).json({ message: 'Server error while deleting complaint.' });
  }
};
