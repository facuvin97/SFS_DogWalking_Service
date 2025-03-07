const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db.js");

class Turn extends Model {}

Turn.init(
  {
    dias: {
      type: DataTypes.JSON, // Tipo de datos JSON
      allowNull: false, // No se permite el valor nulo
      validate: {
        // Validación personalizada para verificar si cada día está en la lista permitida
        isValidDay: function (value) {
          const allowedDays = [
            "lunes",
            "martes",
            "miercoles",
            "jueves",
            "viernes",
            "sabado",
            "domingo",
          ];
          for (const day of value) {
            if (!allowedDays.includes(day)) {
              throw new Error(`"${day}" no es un día válido`);
            }
          }
        },
        notEmpty: {
          msg: 'El campo "dias" no puede estar vacío',
        },
      },
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El campo "hora_inicio" no puede estar vacío',
        },
        isTime(value) {
          if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
            throw new Error(
              'El campo "hora_inicio" debe estar en formato HH:mm o HH:mm:ss'
            );
          }
        },
      },
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El campo "hora_fin" no puede estar vacío',
        },
        isTime(value) {
          if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
            throw new Error(
              'El campo "hora_fin" debe estar en formato HH:mm o HH:mm:ss'
            );
          }
        },
        isAfterHoraInicio(value) {
          if (this.hora_inicio && value <= this.hora_inicio) {
            throw new Error(
              'El campo "hora_fin" debe ser mayor que "hora_inicio"'
            );
          }
        },
      },
    },
    tarifa: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'El campo "tarifa" debe ser un número decimal',
        },
        min: {
          args: [0],
          msg: 'El campo "tarifa" debe ser un valor positivo',
        },
        notEmpty: {
          msg: 'El campo "tarifa" no puede estar vacío',
        },
      },
    },
    zona: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El campo "zona" no puede estar vacío',
        },
        len: {
          args: [1, 50],
          msg: 'El campo "zona" debe tener entre 1 y 50 caracteres',
        },
      },
    },
  },
  {
    sequelize,
    modelName: "Turn",
    timestamps: true, // necesario para paranoid
    paranoid: true, // activa la baja lógica
  }
);

module.exports = Turn;
