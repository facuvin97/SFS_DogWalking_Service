const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');

class Bill extends Model {}

Bill.init({
  fecha: {
    type: DataTypes.DATE,
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'El campo "monto" debe ser un número decimal'
      },
      min: {
        args: [0],
        msg: 'El campo "monto" debe ser un valor positivo'
      },
      notEmpty: {
        msg: 'El campo "monto" no puede estar vacío'
      }
    }
  },
  pagado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pendiente: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'Bill'
});


module.exports = Bill;
