const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');

class Turn extends Model {}

Turn.init({
  // dias: {
  //   type: DataTypes.ARRAY(DataTypes.STRING)
  // },
  dias: {
    type: DataTypes.ENUM,
    values: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
  },
  hora_inicio: {
    type: DataTypes.TIME
  },
  hora_fin: {
    type: DataTypes.TIME
  },
  tarifa: {
    type: DataTypes.DECIMAL(10, 2)
  },
  zona: {
    type: DataTypes.STRING
  }
}, {
  sequelize,
  modelName: 'Turn'
})

module.exports = Turn;