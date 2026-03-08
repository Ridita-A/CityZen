const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust path if needed

const Otp = sequelize.define('Otp', {
    challengeId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    firebaseUid: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    purpose: {
        type: DataTypes.ENUM('signup', 'login'),
        allowNull: false,
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    payload: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
}, {
    tableName: 'email_otps',
    timestamps: true,
});

module.exports = Otp;
