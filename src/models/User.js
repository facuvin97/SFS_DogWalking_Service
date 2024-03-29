const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');
const Message = require('./Message.js');

class User extends Model {}

User.init({
  foto: {
    type: DataTypes.STRING, // O podemos usar DataTypes.BLOB para almacenar imágenes en la base de datos
    allowNull: false
  },
  nombre_usuario: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contraseña: {
    type: DataTypes.STRING,
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING
  },
  calificacion: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize,
  modelName: 'User'
});

module.exports = User;
