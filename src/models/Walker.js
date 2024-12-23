const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');
const User = require('./User.js');

class Walker extends User {}

Walker.init({
  fotos: {
    type: DataTypes.JSON,
    defaultValue: [],
  }, 
  efectivo: {
    type: DataTypes.BOOLEAN,  
    defaultValue: true
  }, 
  mercadopago: {
    type: DataTypes.BOOLEAN,  
    defaultValue: false,
  }, 
  access_token: {
    type: DataTypes.STRING,  
    allowNull: true,
  }, 
  refresh_token: {
    type: DataTypes.STRING,  
    allowNull: true,
  }, 
  public_key: {
    type: DataTypes.STRING,  
    allowNull: true,
  }, 
  fecha_mercadopago: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Walker',
  timestamps: false
});

Walker.belongsTo(User, { foreignKey: 'id', targetKey: 'id'});

module.exports = Walker