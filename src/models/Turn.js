const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');

class Turn extends Model {}

Turn.init({
  // dias: {
  //   type: DataTypes.ARRAY(DataTypes.STRING)
  // },
  dias: {
    type: DataTypes.JSON, // Tipo de datos JSON
    allowNull: false, // No se permite el valor nulo
    validate: {
      // Validación personalizada para verificar si cada día está en la lista permitida
      isValidDay: function(value) {
        const allowedDays = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        for (const day of value) {
          if (!allowedDays.includes(day)) {
            throw new Error(`"${day}" no es un día válido`);
          }
        }
      }
    }
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