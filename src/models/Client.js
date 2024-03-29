const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');
const User = require('./User.js');
//const Servicio = require('./Servicio.js');
//const Mascota = require('./Mascota.js');

class Client extends User {}

Client.init({
}, {
  sequelize,
  modelName: 'Client',
  timestamps: false
});

Client.User = Client.belongsTo(User, { foreignKey: 'id', targetKey: 'id' });
//Cliente.hasMany(Servicio); // Un cliente puede tener muchos servicios
//Cliente.hasMany(Mascota); //En el diagrama dice que siempre tiene que tener una mascota, pensadolo bien no se si tiene por que ser asi

module.exports = Client;
