const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComplaintImages = sequelize.define('ComplaintImages', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  complaintId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  imageURL: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  processedImageURL: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('initial', 'progress', 'resolution', 'appeal', 'evidence'),
    defaultValue: 'initial',
    allowNull: false
  },
  imageHash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  aiVerdict: {
    type: DataTypes.ENUM('genuine', 'inconclusive', 'suspicious'),
    allowNull: true,
    defaultValue: null
  },
  aiConfidence: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  aiReasoning: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  }
});

module.exports = ComplaintImages;