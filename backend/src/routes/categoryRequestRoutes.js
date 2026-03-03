const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const categoryRequestController = require('../controllers/categoryRequestController');

// Citizen: save a complaint as a draft when AI detects an unknown category
router.post('/category-requests/draft', upload.array('images'), categoryRequestController.saveDraftComplaint);

// Admin: list category requests (filter by ?status=pending|approved|rejected)
router.get('/category-requests', categoryRequestController.getPendingRequests);

// Admin: approve a pending category request
router.patch('/category-requests/:id/approve', categoryRequestController.approveRequest);

// Admin: reject a pending category request
router.patch('/category-requests/:id/reject', categoryRequestController.rejectRequest);

module.exports = router;
