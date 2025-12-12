const sequelize = require('../config/database');
const User = require('./User');
const Citizen = require('./Citizen');
const Authority = require('./Authority');
const Admin = require('./Admin');

// --- Define Associations (One-to-One) ---

// A User HAS ONE role-specific profile
User.hasOne(Citizen, {
  foreignKey: {
    name: 'UserFirebaseUid',
    allowNull: false
  },
  onDelete: 'CASCADE' 
});
Citizen.belongsTo(User);

User.hasOne(Authority, {
  foreignKey: {
    name: 'UserFirebaseUid',
    allowNull: false
  },
  onDelete: 'CASCADE'
});
Authority.belongsTo(User);

User.hasOne(Admin, {
  foreignKey: {
    name: 'UserFirebaseUid',
    allowNull: false
  },
  onDelete: 'CASCADE'
});
Admin.belongsTo(User);


module.exports = {
  sequelize,
  User,
  Citizen,
  Authority,
  Admin
};