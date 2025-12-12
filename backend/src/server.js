// Load env from project root (.env)
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

console.log('Loaded DATABASE_URL:', process.env.DATABASE_URL || '(not found)');

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const logger = require('./utils/logger');
const env = require('./config/env');
const sequelize = require('./config/database');
const initFirebase = require('./config/firebase');

const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

async function startServer() {
	// -------------------------------
	// Initialize Firebase
	// -------------------------------
	try {
		initFirebase();
		logger.info("Firebase initialized successfully");
	} catch (err) {
		logger.error("Firebase initialization failed:", err.message);
	}

	// -------------------------------
	// Test database connection
	// -------------------------------
	try {
		await sequelize.authenticate();
		logger.info("Database connection successful");

		await sequelize.sync();
		logger.info("Models synced");
	} catch (err) {
		logger.error("Database connection failed:", err.message);
	}

	// -------------------------------
	// Express app
	// -------------------------------
	const app = express();

	app.use(cors());
	app.use(express.json());
	app.use(morgan('dev'));

	// Health check endpoint
	app.get('/api/health', (req, res) => {
		res.json({
			ok: true,
			env: env.nodeEnv || "unknown",
			dbConnected: sequelize?.config ? true : false
		});
	});

	// API Routes
	app.use('/api/auth', authRoutes);

	// Static folder
	app.use('/public', express.static(path.join(__dirname, 'public')));

	// Error handler
	app.use(errorHandler);

	const port = env.port || 3000;
	app.listen(port, () => {
		logger.info(`Server running on port ${port}`);
	});
}

// Start server
startServer().catch((err) => {
	console.error("Fatal error starting server:", err);
	process.exit(1);
});
