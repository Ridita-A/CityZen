const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Authority = sequelize.define('Authority', {
  department: {
    type: DataTypes.STRING, 
    allowNull: false
  },
  ward: {
    type: DataTypes.STRING, 
    allowNull: false
  }
});

module.exports = Authority;