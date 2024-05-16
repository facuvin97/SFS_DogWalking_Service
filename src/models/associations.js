const Message = require("./Message");
const Turn = require("./Turn");
const User = require("./User");
const Walker = require("./Walker");
const Service = require("./Service");
const Client = require("./Client");

//Mensaje - Usuario
Message.belongsTo(User, { as: 'sender', /*foreignKey: 'senderId'*/ });
Message.belongsTo(User, { as: 'receiver', /*foreignKey: 'receiverId'*/ });

//Paseador - Turno
Turn.belongsTo(Walker);
Walker.hasMany(Turn);

//Turno - Servicio
Service.belongsTo(Turn);
Turn.hasMany(Service);

//Cliente - Servicio
Service.belongsTo(Client)
Client.hasMany(Service)