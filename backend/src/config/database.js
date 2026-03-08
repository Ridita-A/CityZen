// backend/src/config/database.js

// 1. Import necessary libraries using CommonJS
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// NOTE: Ensure you have 'sequelize' and 'pg' installed:
// npm install sequelize pg 

// 2. Initialize the Sequelize ORM instance using the DATABASE_URL
const sequelize = new Sequelize(
  process.env.DATABASE_URL, 
  {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false, // Set to true to see SQL queries if needed
    pool: {
      // Adjusted for PgBouncer compatibility
      max: toInt(process.env.DB_POOL_MAX, 5),
      min: toInt(process.env.DB_POOL_MIN, 0),
      acquire: toInt(process.env.DB_POOL_ACQUIRE_MS, 30000),
      idle: toInt(process.env.DB_POOL_IDLE_MS, 5000), // Reduced to prevent stale connections
      evict: toInt(process.env.DB_POOL_EVICT_MS, 1000),
    },
    // Required for secure connections to services like Supabase
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Prevents errors with self-signed certificates
      },
      // Add statement_timeout for PgBouncer compatibility
      statement_timeout: 30000, // 30 seconds
      idle_in_transaction_session_timeout: 10000, // 10 seconds
    },
    // Retry options for connection failures
    retry: {
      max: 3,
      match: [
        /ECONNRESET/,
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ENOTFOUND/,
        /EAI_AGAIN/
      ]
    }
  }
);

// 3. EXPORT THE SEQUELIZE INSTANCE
module.exports = sequelize;
