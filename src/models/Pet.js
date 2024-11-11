const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');
const Client = require('./Client.js');

class Pet extends Model {}

Pet.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]  // Nombre debe tener entre 1 y 255 caracteres
    }
  },
  breed: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]  // Especie debe tener entre 1 y 255 caracteres
    }
  },
  size: {
    type: DataTypes.ENUM('pequeño', 'mediano', 'grande'),
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0  // La edad no puede ser negativa
    }
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'Pet',
  timestamps: false
});

module.exports = Pet;
