const Message = require("./Message");
const Turn = require("./Turn");
const User = require("./User");
const Walker = require("./Walker");
const Service = require("./Service");
const Client = require("./Client");
const Notification = require("./Notification")
const Pet = require("./Pet");
const Review = require("./Review");
const Bill = require("./Bill");
const Location = require("./Location");

//Servicio - Factura

Bill.belongsTo(Service)
Service.hasOne(Bill)

//Mensaje - Usuario
Message.belongsTo(User, { as: 'sender', /*foreignKey: 'senderId'*/ });
Message.belongsTo(User, { as: 'receiver', /*foreignKey: 'receiverId'*/ });

//Reseña - Usuario
Review.belongsTo(User, { as: 'writer', /*foreignKey: 'senderId'*/ });
Review.belongsTo(User, { as: 'receiver', /*foreignKey: 'receiverId'*/ });

//Notificacion - Usuario
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

//Paseador - Turno
Turn.belongsTo(Walker);
Walker.hasMany(Turn);

//Turno - Servicio
Service.belongsTo(Turn);
Turn.hasMany(Service);

//Cliente - Servicio
Service.belongsTo(Client)
Client.hasMany(Service)

// Cliente - Mascota
Client.hasMany(Pet, { foreignKey: 'clientId' });
Pet.belongsTo(Client, { foreignKey: 'clientId' });

// Walker - Location
Walker.hasOne(Location);
Location.belongsTo(Walker);

module.exports = {
    Message,
    Turn,
    User,
    Walker,
    Service,
    Client,
    Notification,
    Pet,
    Bill,
  };