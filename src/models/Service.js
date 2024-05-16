const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');

class Service extends Model {}

Service.init(
  {
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      validate:{
        isDate: true,
      },
    },
    direccionPickUp: {
      type: DataTypes.STRING,
      allowNull: false,
      validate:{
        len: [1, 100]
      },
    },
    cantidad_mascotas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate:{
        min: 1,
      }
    },
    nota: {
      type: DataTypes.STRING,
      validate:{
        len: [1, 255]
      },
    }
  },
  {
    sequelize, 
    modelName: 'Service'
  }
);

module.exports = Service;