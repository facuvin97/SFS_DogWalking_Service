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
    type: DataTypes.DATE, // Utilizamos DataTypes.DATE para representar DATETIME
    allowNull: false,
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
