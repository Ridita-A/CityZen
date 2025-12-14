const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function initFirebase() {
  const svcPath = path.resolve(process.cwd(), 'backend', 'src', 'config', 'firebase-service-account.json');
  if (fs.existsSync(svcPath)) {
    try {
      const serviceAccount = require(svcPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET_URL // Add this line
      });
      console.log('Firebase initialized');
      return admin;
    } catch (e) {
      console.warn('Failed to initialize Firebase:', e.message);
      return null;
    }
  }
  // If no service account provided, don't init firebase (optional)
  return null;
}

module.exports = initFirebase;
