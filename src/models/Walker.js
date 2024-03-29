const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');
const User = require('./User.js');

class Walker extends User {}

Walker.init({
  fotos: {
    type: DataTypes.JSON  // O puedes usar type:  DataTypes.ARRAY(DataTypes.STRING) si solo necesitas almacenar las rutas de las imágenes
  }, 
}, {
  sequelize,
  modelName: 'Walker',
  timestamps: false
});

Walker.belongsTo(User, { foreignKey: 'id', targetKey: 'id'});

module.exports = Walker