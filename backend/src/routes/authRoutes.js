// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 1. SIGNUP: POST /api/auth/users
router.post('/users', authController.registerProfile);
router.post('/auth/signup/request-otp', authController.requestSignupOtp);
router.post('/auth/login/request-otp', authController.requestLoginOtp);
router.post('/auth/otp/verify', authController.verifyOtpChallenge);

// Backward-compatible OTP routes
router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);

// 2. LOGIN: GET /api/auth/users/:firebaseUid (NEW ROUTE)
// Fetches the user's profile and role using the UID from successful Firebase login.
router.get('/users/:firebaseUid', authController.getProfileByUid);

module.exports = router;