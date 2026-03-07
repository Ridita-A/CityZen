const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  citizenUid: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Null when complaint is a draft awaiting category approval
  },
  pendingCategoryRequestId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(8, 6),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: false,
  },
  currentStatus: {
    type: DataTypes.ENUM('draft', 'pending', 'accepted', 'in_progress', 'resolved', 'appealed', 'completed', 'rejected', 'critical_failure'),
    allowNull: false
  },
  upvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  statusNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 }
  },
  appealReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  appealStatus: {
    type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'),
    defaultValue: 'none'
  },
  forwardedByAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  escalationLevel: {
    type: DataTypes.ENUM('none', 'track_a', 'track_b', 'both'),
    defaultValue: 'none'
  },
  escalatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  adminDeadlineAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  adminDeadlineStatus: {
    type: DataTypes.ENUM('none', 'active', 'cleared', 'missed'),
    defaultValue: 'none'
  },
  responseDelayWarningLogged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  trackAAlertedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  trackBAlertedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  criticalFailureAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  misconductReportPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  misconductReportGeneratedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  adminRemarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lastBumpedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  bumpCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  priorityScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastAuthorityActivityAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Complaint;