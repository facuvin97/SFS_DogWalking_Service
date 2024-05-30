const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');

class Service extends Model {}

Service.init(
  {
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'El campo "fecha" debe ser una fecha válida'
        },
        notEmpty: {
          msg: 'El campo "fecha" no puede estar vacío'
        }
      }
    },
    direccionPickUp: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El campo "direccionPickUp" no puede estar vacío'
        },
        len: {
          args: [1, 100],
          msg: 'El campo "direccionPickUp" debe tener entre 1 y 100 caracteres'
        }
      }
    },
    cantidad_mascotas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: 'El campo "cantidad_mascotas" debe ser un número entero'
        },
        min: {
          args: [1],
          msg: 'El campo "cantidad_mascotas" debe ser al menos 1'
        },
        notEmpty: {
          msg: 'El campo "cantidad_mascotas" no puede estar vacío'
        }
      }
    },
    nota: {
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [1, 255],
          msg: 'El campo "nota" debe tener entre 1 y 255 caracteres'
        },
        notEmpty: {
          msg: 'El campo "nota" no puede estar vacío'
        }
      }
    },
    aceptado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'Service'
  }
)
module.exports = Service;