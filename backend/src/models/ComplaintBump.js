const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComplaintBump = sequelize.define('ComplaintBump', {
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
  citizenUid: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bumpedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = ComplaintBump;
