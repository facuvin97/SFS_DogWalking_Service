const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // 

class Location extends Model {}

Location.init({
  lat: {
    type: DataTypes.DOUBLE(8, 6),
    allowNull: false,
    validate: { min: -90, max: 90 }
  },
  long: {
    type: DataTypes.DOUBLE(9, 6),
    allowNull: false,
    validate: { min: -180, max: 180 }
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
}, {
  sequelize,
  modelName: 'Location',
});

module.exports = Location;
