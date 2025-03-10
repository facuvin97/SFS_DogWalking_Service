const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');
const Message = require('./Message.js');
const moment = require('moment')

class User extends Model {}

User.init({
  foto: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'El campo "foto" debe ser una URL válida'
      }
    }
  },
  nombre_usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'El nombre de usuario ya está en uso'
    },
    validate: {
      notEmpty: {
        msg: 'El campo "nombre_usuario" no puede estar vacío'
      },
      len: {
        args: [3, 20],
        msg: 'El campo "nombre_usuario" debe tener entre 3 y 20 caracteres'
      }
    }
  },
  contraseña: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El campo "contraseña" no puede estar vacío'
      },
      len: {
        args: [7, 200],
        msg: 'El campo "contraseña" debe tener entre 7 y 30 caracteres'
      }
    }
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El campo "direccion" no puede estar vacío'
      },
      len: {
        args: [1, 100],
        msg: 'El campo "direccion" debe tener entre 1 y 100 caracteres'
      }
    }
  },
  fecha_nacimiento: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isDateFormat(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          throw new Error('La fecha debe tener el formato yyyy-MM-dd');
        }
      },
      isMinAge(value) {
        const age = moment().diff(moment(value, 'YYYY-MM-DD'), 'years');
        if (age < 15) {
          throw new Error('Debes ser mayor de 15 años para registrarte');
        }
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'El email ya está en uso'
    },
    validate: {
      isEmail: {
        msg: 'El campo "email" debe ser un email válido'
      },
      notEmpty: {
        msg: 'El campo "email" no puede estar vacío'
      }
    }
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El campo "telefono" no puede estar vacío'
      },
      len: {
        args: [5, 20],
        msg: 'El campo "telefono" debe tener entre 5 y 20 caracteres'
      }
    }
  },
  calificacion: {
    type: DataTypes.INTEGER,
    validate: {
      min: {
        args: [1],
        msg: 'La calificación debe ser al menos 1'
      },
      max: {
        args: [5],
        msg: 'La calificación debe ser un número igual o menor a 5'
      },
      isInt: {
        msg: 'La calificación debe ser un número entero'
      }
    }
  }
}, {
  sequelize,
  modelName: 'User'
});

module.exports = User;
