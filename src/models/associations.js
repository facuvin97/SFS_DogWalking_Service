const Message = require("./Message");
const Turn = require("./Turn");
const User = require("./User");
const Walker = require("./Walker");

Message.belongsTo(User, { as: 'sender', /*foreignKey: 'senderId'*/ });
Message.belongsTo(User, { as: 'receiver', /*foreignKey: 'receiverId'*/ });

//Paseador - Turno
Turn.belongsTo(Walker);
Walker.hasMany(Turn);