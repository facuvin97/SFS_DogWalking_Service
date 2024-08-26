const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');
const User = require('./User.js');

class Walker extends User {}

Walker.init({
  fotos: {
    type: DataTypes.JSON,
    allowNull: true 
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
    validate: {
      isDateFormat(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          throw new Error('La fecha debe tener el formato yyyy-MM-dd');
        }
      }
    }
  },
}, {
  sequelize,
  modelName: 'Walker',
  timestamps: false
});

Walker.belongsTo(User, { foreignKey: 'id', targetKey: 'id'});

module.exports = Walker