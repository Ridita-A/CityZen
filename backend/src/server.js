const path = require('path');
require('dotenv').config();
console.log('Loaded DATABASE_URL:', process.env.DATABASE_URL);



const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const logger = require('./utils/logger');
const env = require('./config/env');
const sequelize = require('./config/database');
const initFirebase = require('./config/firebase');

const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

async function start() {
	// Try to initialize firebase (optional)
	try { initFirebase(); } catch (e) { /* ignore */ }

	// Test DB connection and sync models
	try {
		await sequelize.authenticate();
		await sequelize.sync();
		logger.info('Database connected and synced');
	} catch (e) {
		logger.warn('Database connection failed (continuing with fallback):', e.message);
	}

	const app = express();
	app.use(cors());
	app.use(express.json());
	app.use(morgan('dev'));

	app.get('/api/health', (req, res) => res.json({ ok: true, env: env.nodeEnv }));

	app.use('/api/auth', authRoutes);

	// Static for uploads or public files (if needed)
	app.use('/public', express.static(path.join(process.cwd(), 'backend', 'public')));

	app.use(errorHandler);

	const port = env.port || 3000;
	app.listen(port, () => {
		logger.info(`Server listening on port ${port}`);
	});
}

start().catch((err) => {
	console.error('Failed to start server', err);
	process.exit(1);
});
