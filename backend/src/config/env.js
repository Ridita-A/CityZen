// src/config/env.js
const path = require('path');
const dotenv = require('dotenv');

// Try to load from backend/.env (when cwd is project root or backend)
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (result.parsed) break;
}

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'change_this_jwt_secret',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: (process.env.DB_SSL || 'false') === 'true',
    url: process.env.DATABASE_URL, // CHANGED: Removed "|| null"
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  supabaseUrl: process.env.SUPABASE_URL, // Add Supabase URL
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY, // Add Supabase Service Key
};
