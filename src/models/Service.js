const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');

class Service extends Model {}

Service.init(
  {
    fecha: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isDateFormat(value) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            throw new Error('La fecha debe tener el formato yyyy-MM-dd');
          }
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
          args: [0, 255],
          msg: 'El campo "nota" debe tener entre 1 y 255 caracteres'
        }
      }
    },
    aceptado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    comenzado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    finalizado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    calificado_x_cliente: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    calificado_x_paseador: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
  },
  {
    sequelize,
    modelName: 'Service'
  }
)
module.exports = Service;