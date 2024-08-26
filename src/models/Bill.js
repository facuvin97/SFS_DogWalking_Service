const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');

class Bill extends Model {}

Bill.init({
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
