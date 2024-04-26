const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');
const Message = require('./Message.js');

class User extends Model {}

User.init({
  foto: {
    type: DataTypes.BLOB, // O podemos usar DataTypes.BLOB para almacenar imágenes en la base de datos
    allowNull: false
  },
  nombre_usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3,20],
    }
  },
  contraseña: {
    type: DataTypes.STRING,
    allowNull: false,
    notEmpty: true,
    validate:{
      len: [7,30],
    },
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false,
    validate:{
      len: [1, 100]
    },
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: false,
    validate:{
      isDate: true,
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate:{
      isEmail: true,
    },
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
    validate:{
      len: {
        args: [5, 20],
        msg: "El telefono debe tener un largo entre 5 y 20 caracteres"
      }
    },
  },
  calificacion: {
    type: DataTypes.INTEGER,
    validate:{
      min: 1,
      max: {
        args: [5],
        msg: "Calificacion debe ser un numero igual o menor de 5"
      },
      isDecimal: true,
    },
  }
}, {
  sequelize,
  modelName: 'User'
});

module.exports = User;
