const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');
const User = require('../models/User.js')


class Review extends Model {}

Review.init(
  {
    valoracion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: 'El campo "valoracion" debe ser un número entero'
        },
        min: {
          args: [1],
          msg: 'El campo "valoracion" debe ser al menos 1'
        },
        max: {
          args: [5],
          msg: 'El campo "valoracion" debe de maximo 5'
        },
        notEmpty: {
          msg: 'El campo "valoracion" no puede estar vacío'
        }
      }
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El campo "descripcion" no puede estar vacío'
        },
        len: {
          args: [1, 100],
          msg: 'El campo "descripcion" debe tener entre 1 y 100 caracteres'
        }
      }
    },
  },
  {
    sequelize,
    modelName: 'Review'
  }
)


module.exports = Review;