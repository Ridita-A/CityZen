// backend/src/controllers/authController.js
const { User, Citizen, Authority, Admin, sequelize } = require('../models');
const { Otp } = require('../models'); // New: Import Otp model
const nodemailer = require('nodemailer'); // New: Import nodemailer
const crypto = require('crypto'); // New: Import crypto

// Read the secret key from the backend/.env file
const ADMIN_CODE_SECRET = process.env.ADMIN_CODE_SECRET;

function normalizeRole(role = '') {
  return String(role).trim().toLowerCase();
}

function assertAdminCodeIfNeeded(role, adminCode) {
  if (role !== 'admin') return;
  if (!ADMIN_CODE_SECRET) return;
  if (!adminCode || adminCode !== ADMIN_CODE_SECRET) {
    throw new Error('Invalid admin code.');
  }
}

async function createRoleProfile(data, transaction) {
  const {
    firebaseUid,
    email,
    fullName,
    role,
    department,
    authorityCompanyId,
    adminCode,
  } = data;

  const normalizedRole = normalizeRole(role);

  if (!firebaseUid || !email || !fullName || !normalizedRole) {
    throw new Error('Missing core identity fields.');
  }

  if (!['citizen', 'authority', 'admin'].includes(normalizedRole)) {
    throw new Error('Invalid role selected.');
  }

  assertAdminCodeIfNeeded(normalizedRole, adminCode);

  const [user, created] = await User.findOrCreate({
    where: { firebaseUid },
    defaults: { firebaseUid, email, fullName, role: normalizedRole },
    transaction,
  });

  if (!created) {
    user.email = email;
    user.fullName = fullName;
    user.role = normalizedRole;
    await user.save({ transaction });
  }

  if (normalizedRole === 'citizen') {
    await Citizen.findOrCreate({
      where: { UserFirebaseUid: firebaseUid },
      defaults: { UserFirebaseUid: firebaseUid },
      transaction,
    });
  } else if (normalizedRole === 'authority') {
    if (!authorityCompanyId) {
      throw new Error('Authority signup requires Department selection.');
    }

    const [authority] = await Authority.findOrCreate({
      where: { UserFirebaseUid: firebaseUid },
      defaults: { UserFirebaseUid: firebaseUid, authorityCompanyId, department },
      transaction,
    });

    authority.authorityCompanyId = authorityCompanyId;
    authority.department = department || authority.department;
    await authority.save({ transaction });
  } else if (normalizedRole === 'admin') {
    await Admin.findOrCreate({
      where: { UserFirebaseUid: firebaseUid },
      defaults: { UserFirebaseUid: firebaseUid },
      transaction,
    });
  }

  return user;
}

async function fetchUserProfile(firebaseUid) {
  return User.findOne({
    where: { firebaseUid },
    attributes: ['firebaseUid', 'email', 'fullName', 'role', 'createdAt'],
    include: [
      { model: Citizen, required: false },
      {
        model: Authority,
        required: false,
        include: [
          {
            model: sequelize.models.AuthorityCompany,
            attributes: ['id', 'name', 'description'],
            required: false,
          }
        ]
      },
      { model: Admin, required: false },
    ]
  });
}

// Helper to send email (New)
async function sendOtpEmail(toEmail, otpCode) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Your verification code',
    text: `Your verification code is ${otpCode}. It expires in 10 minutes.`,
  };
  await transporter.sendMail(mailOptions);
}

async function issueOtpChallenge({ email, firebaseUid, purpose, payload }) {
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.update(
    { used: true },
    {
      where: {
        email,
        purpose,
        used: false,
      }
    }
  );

  const challenge = await Otp.create({
    email,
    firebaseUid: firebaseUid || null,
    purpose,
    otp: otpCode,
    expiresAt,
    used: false,
    payload: payload || null,
  });

  await sendOtpEmail(email, otpCode);
  return challenge;
}

// 1. SIGNUP Logic (Existing)
exports.registerProfile = async (req, res) => {
  // Use a transaction to prevent partial data creation
  const t = await sequelize.transaction();
  try {
    const user = await createRoleProfile(req.body, t);

    // Commit the transaction
    await t.commit();
    res.status(201).json({
      message: 'Profile created successfully',
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    // Rollback if any step failed (e.g., missing data, invalid Admin code, DB error)
    await t.rollback();

    console.error('Registration Error:', error.message);

    // Send a 400 status with a specific error message back to the frontend
    res.status(400).json({ message: `Profile creation failed: ${error.message}` });
  }
};

// 2. LOGIN Logic (NEW)
exports.getProfileByUid = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const user = await fetchUserProfile(firebaseUid);
    if (!user) return res.status(404).json({ message: 'User profile not found in database.' });
    res.json(user);
  } catch (error) {
    console.error('Fetch Profile Error:', error.message);
    res.status(500).json({ message: 'Server error while fetching profile.' });
  }
};

exports.requestSignupOtp = async (req, res) => {
  const { firebaseUid, email, fullName, role, department, authorityCompanyId, adminCode } = req.body;

  if (!firebaseUid || !email || !fullName || !role) {
    return res.status(400).json({ message: 'firebaseUid, email, fullName and role are required.' });
  }

  const normalizedRole = normalizeRole(role);

  if (!['citizen', 'authority', 'admin'].includes(normalizedRole)) {
    return res.status(400).json({ message: 'Invalid role selected.' });
  }

  if (normalizedRole === 'authority' && !authorityCompanyId) {
    return res.status(400).json({ message: 'Authority signup requires Department selection.' });
  }

  try {
    assertAdminCodeIfNeeded(normalizedRole, adminCode);

    const challenge = await issueOtpChallenge({
      email,
      firebaseUid,
      purpose: 'signup',
      payload: {
        firebaseUid,
        email,
        fullName,
        role: normalizedRole,
        department,
        authorityCompanyId,
        adminCode,
      }
    });

    res.json({
      message: 'OTP sent to your email.',
      challengeId: challenge.challengeId,
      email,
      purpose: 'signup',
      expiresAt: challenge.expiresAt,
    });
  } catch (err) {
    console.error('Signup OTP request error:', err);
    res.status(500).json({ message: err.message || 'Failed to send signup OTP.' });
  }
};

exports.requestLoginOtp = async (req, res) => {
  const { firebaseUid } = req.body;

  if (!firebaseUid) {
    return res.status(400).json({ message: 'firebaseUid is required.' });
  }

  try {
    const user = await User.findOne({ where: { firebaseUid } });
    if (!user) {
      return res.status(404).json({ message: 'User profile not found in database.' });
    }

    const challenge = await issueOtpChallenge({
      email: user.email,
      firebaseUid,
      purpose: 'login',
      payload: { firebaseUid }
    });

    res.json({
      message: 'OTP sent to your email.',
      challengeId: challenge.challengeId,
      email: user.email,
      purpose: 'login',
      expiresAt: challenge.expiresAt,
    });
  } catch (err) {
    console.error('Login OTP request error:', err);
    res.status(500).json({ message: err.message || 'Failed to send login OTP.' });
  }
};

exports.verifyOtpChallenge = async (req, res) => {
  const { challengeId, otp } = req.body;

  if (!challengeId || !otp) {
    return res.status(400).json({ message: 'challengeId and otp are required.' });
  }

  try {
    const record = await Otp.findOne({ where: { challengeId, used: false } });

    if (!record) {
      return res.status(400).json({ message: 'Invalid or already used OTP challenge.' });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired.' });
    }

    if (String(record.otp) !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    if (record.purpose === 'signup') {
      const payload = record.payload || {};
      const t = await sequelize.transaction();

      try {
        const user = await createRoleProfile(payload, t);
        
        // Mark OTP as used only after successful profile creation
        record.used = true;
        await record.save({ transaction: t });
        
        await t.commit();
        
        const profile = await fetchUserProfile(user.firebaseUid);

        return res.json({
          message: 'Signup OTP verified successfully.',
          purpose: 'signup',
          user: profile,
        });
      } catch (error) {
        await t.rollback();
        return res.status(400).json({ message: `Profile creation failed: ${error.message}` });
      }
    }

    // For login, mark used after validation
    record.used = true;
    await record.save();

    const loginUid = record.firebaseUid || record.payload?.firebaseUid;
    if (!loginUid) {
      return res.status(400).json({ message: 'Invalid login challenge payload.' });
    }

    const profile = await fetchUserProfile(loginUid);
    if (!profile) {
      return res.status(404).json({ message: 'User profile not found in database.' });
    }

    return res.json({
      message: 'Login OTP verified successfully.',
      purpose: 'login',
      user: profile,
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ message: 'Verification failed.' });
  }
};

exports.requestOtp = exports.requestLoginOtp;
exports.verifyOtp = exports.verifyOtpChallenge;
