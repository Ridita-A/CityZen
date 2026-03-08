const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

console.log('Loaded DATABASE_URL:', process.env.DATABASE_URL ? '(set)' : '(not found)');

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const { sequelize } = require('./models');
const logger = require('./utils/logger');
const env = require('./config/env');
const seedDatabase = require('./utils/seeder'); // Import the seeder logic

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const aiRoutes = require('./routes/aiRoutes');
const moderationRoutes = require('./routes/moderationRoutes');
const categoryRequestRoutes = require('./routes/categoryRequestRoutes');
const errorHandler = require('./middleware/errorHandler');

function resolveSyncConfig(syncModeValue) {
    const syncMode = (syncModeValue || 'create').toLowerCase();

    switch (syncMode) {
        case 'none':
            return { mode: 'none', options: null };
        case 'alter':
            return { mode: 'alter', options: { alter: true } };
        case 'force':
            return { mode: 'force', options: { force: true } };
        case 'create':
        case 'safe':
            return { mode: 'create', options: {} };
        default:
            logger.warn(`Unknown DB_SYNC_MODE "${syncModeValue}", falling back to safe sync`);
            return { mode: 'create', options: {} };
    }
}

async function startServer() {
    try {
        // -------------------------------
        // Test database connection
        // -------------------------------
        await sequelize.authenticate();
        logger.info("Database connection successful");

        const syncConfig = resolveSyncConfig(process.env.DB_SYNC_MODE);
        if (syncConfig.options) {
            logger.info(`Syncing models using ${syncConfig.mode} mode`);
            await sequelize.sync(syncConfig.options);
            logger.info("Models synced");
        } else {
            logger.info("Skipping model sync");
        }

        // Run the seeding logic
        await seedDatabase();

    } catch (err) {
        logger.error("Database initialization failed: ", err);
        console.error("Full error:", err);
        throw err;
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
    app.use('/api', authRoutes);
    app.use('/api', complaintRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/moderation', moderationRoutes);
    app.use('/api', categoryRequestRoutes);

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
