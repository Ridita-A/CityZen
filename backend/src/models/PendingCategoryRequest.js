const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PendingCategoryRequest = sequelize.define('PendingCategoryRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  categoryLabel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoryDescription: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false,
  },
  adminRemarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approvedCategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = PendingCategoryRequest;
