const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Citizen = sequelize.define('Citizen', {
  ward: {
    type: DataTypes.STRING, 
    allowNull: false
  }
});

module.exports = Citizen;