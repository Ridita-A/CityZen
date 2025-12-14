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

    const imageFile = req.file;

    if (!title || !latitude || !longitude || !citizenUid || !categoryId || !imageFile) {
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

    // Supabase Storage integration
    if (imageFile) {
      const bucketName = 'cityzen-media'; // TODO: Replace with your actual Supabase bucket name
      const filePath = `complaint_images/${complaint.id}_${Date.now()}_${imageFile.originalname}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imageFile.buffer, {
          contentType: imageFile.mimetype,
          upsert: false, // Set to true if you want to overwrite existing files with the same name
        });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData, error: publicUrlError } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (publicUrlError) {
        throw new Error(`Supabase getPublicUrl failed: ${publicUrlError.message}`);
      }
      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error(`Supabase getPublicUrl returned invalid data: ${JSON.stringify(publicUrlData)}`);
      }

      const imageUrl = publicUrlData.publicUrl;

      // Ensure complaint.id is valid before creating ComplaintImages
      if (!complaint.id) {
        throw new Error('Complaint ID is null after creation, cannot link image.');
      }

      await ComplaintImages.create({
        complaintId: complaint.id,
        imageURL: imageUrl,
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
