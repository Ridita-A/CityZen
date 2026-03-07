const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { Category, Complaint, ComplaintImages } = require('../models');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Changed to memory storage

const AI_SERVICE_URL = process.env.EXPO_PUBLIC_AI_SERVICE_URL || process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const OPENROUTER_API_URL = process.env.EXPO_PUBLIC_OPENROUTER_API_URL || process.env.OPENROUTER_API_URL || 'http://127.0.0.1:8001';

router.post('/detect-pothole', upload.single('image'), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append(
      'image',
      req.file.buffer,
      { filename: req.file.originalname, contentType: req.file.mimetype }
    );

    const aiRes = await axios.post(
      `${AI_SERVICE_URL}/detect`,
      formData,
      { headers: formData.getHeaders() }
    );

    res.json(aiRes.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'AI detection failed' });
  }
});

router.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const geminiRes = await axios.post(
      `${OPENROUTER_API_URL}/generate`,
      { prompt }
    );

    res.json(geminiRes.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gemini text generation failed' });
  }
});

router.post('/detect-with-openrouter', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('Image file is required');
    }

    // Fetch categories from the database
    const categories = await Category.findAll({ attributes: ['id', 'name'] });
    const categoryList = categories.map(cat => ({ id: cat.id, name: cat.name }));

    const formData = new FormData();
    formData.append('image', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
    formData.append('categories', JSON.stringify(categoryList));

    const openrouterRes = await axios.post(
      `${OPENROUTER_API_URL}/detect_with_llm`,
      formData,
      { headers: { ...formData.getHeaders(), 'Content-Type': `multipart/form-data; boundary=${formData._boundary}` } }
    );

    const llmData = openrouterRes.data;
    const detectedLabel = (llmData.label || '').trim();

    const normalizedLabel = detectedLabel.toLowerCase();
    const matchedCategory = categoryList.find(c => c.name.toLowerCase().trim() === normalizedLabel);

    const isNewCategory = !matchedCategory && normalizedLabel !== 'no issue' && detectedLabel !== '';
    const categoryId = matchedCategory ? matchedCategory.id : null;
    // Normalize label to the exact DB spelling if matched
    const resolvedLabel = matchedCategory ? matchedCategory.name : detectedLabel;

    res.json({
      ...llmData,
      id: categoryId,
      label: resolvedLabel,
      is_new_category: isNewCategory,
    });
  } catch (err) {
    console.error(err);
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'OpenRouter detection failed', error: err.message });
  }
});

/* =========================
   VERIFY EVIDENCE WITH AI
========================= */
router.post('/verify-evidence', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const { complaintId, evidenceType } = req.body;
    if (!complaintId) {
      return res.status(400).json({ message: 'Complaint ID is required' });
    }

    // Fetch complaint with its category and original images
    const complaint = await Complaint.findByPk(complaintId, {
      include: [
        { model: Category },
        { model: ComplaintImages, as: 'images', where: { type: 'initial' }, required: false }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const categoryName = complaint.Category?.name || 'Unknown';
    const complaintTitle = complaint.title || 'Untitled';
    const complaintDescription = complaint.description || '';

    // Download original complaint images and convert to base64
    const originalImagesBase64 = [];
    if (complaint.images && complaint.images.length > 0) {
      for (const img of complaint.images) {
        try {
          const imgResponse = await axios.get(img.imageURL, { responseType: 'arraybuffer', timeout: 10000 });
          const base64 = Buffer.from(imgResponse.data).toString('base64');
          originalImagesBase64.push(base64);
        } catch (imgErr) {
          console.warn(`Failed to download original image ${img.imageURL}:`, imgErr.message);
          // Continue without this image
        }
      }
    }

    // Build form data for OpenRouter
    const formData = new FormData();
    formData.append('image', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
    formData.append('complaint_category', categoryName);
    formData.append('complaint_title', complaintTitle);
    formData.append('complaint_description', complaintDescription);
    formData.append('evidence_type', evidenceType || 'authority');
    formData.append('original_images', JSON.stringify(originalImagesBase64));

    const openrouterRes = await axios.post(
      `${OPENROUTER_API_URL}/verify_evidence`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 60000 // 60s timeout for AI processing
      }
    );

    res.json(openrouterRes.data);
  } catch (err) {
    console.error('Evidence verification error:', err.message);
    res.status(500).json({ message: 'Evidence verification failed', error: err.message });
  }
});

module.exports = router;
