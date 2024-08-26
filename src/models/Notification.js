const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // 

class Notification extends Model {}

Notification.init({
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contenido: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fechaHora: {
    type: DataTypes.STRING, // Utilizamos DataTypes.DATE para representar DATETIME
    allowNull: false,
    validate: {
      isDateTimeFormat(value) {
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) {
          throw new Error('La fecha y hora deben tener el formato yyyy-MM-dd HH:mm');
        }
      }
    }
  },
  leido: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  sequelize,
  modelName: 'Notification',
});

module.exports = Notification;
