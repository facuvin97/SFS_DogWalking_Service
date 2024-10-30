const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js');

const User = require('./User.js');

class Message extends Model {}

Message.init({
  fechaHora: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isDateTimeFormat(value) {
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) {
          throw new Error('La fecha y hora deben tener el formato yyyy-MM-dd HH:mm');
        }
      }
    }
  },
  contenido: {
    type: DataTypes.TEXT
  },
  imagen: {
    type: DataTypes.BLOB // Assumiendo que guardas la imagen como datos binarios en la base de datos
  },
  sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true, // Estado por defecto: "false"
  },
  read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false, // Estado por defecto: "false"
  },
}, {
  sequelize,
  modelName: 'Message',
  timestamps: true,
});

// Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
// Message.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });
// User.hasMany(Message);

module.exports = Message;
