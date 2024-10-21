const Message = require("../models/Message.js");
const { format } =require( 'date-fns');
const Service = require("../models/Service.js");
const Turn = require("../models/Turn.js");
const Location = require("../models/Location.js");

let io;

// Función auxiliar para obtener el socket de un usuario por userId
function getSocketByUserId(userId) {
  return Array.from(io.sockets.sockets)
    .find(([id, s]) => s.handshake.auth.userId.toString() === userId.toString());
}

function setupWebSocket(server) {
  const { Server } = require('socket.io');


  // Función auxiliar para emitir un mensaje
  function emitMessage(socket, message) {
    socket.emit('receiveMessage', {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      contenido: message.contenido,
      sent: message.sent,
      read: message.read,
    });
  }


  
  // Configurar socket.io para manejar WebSocket
  io = new Server(server, {
    cors: {
      origin: '*', // Configurar orígenes permitidos (ajusta según tu necesidad)
    },
  });

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    socket.on('authenticate', (userId) => {
      socket.userId = userId; // Asignar el userId al socket
      console.log(`Usuario autenticado: ${userId}`);
    });

    // Manejar la desconexión del cliente
    socket.on('disconnect', () => {
      console.log(`Usuario ${socket.userId || 'desconocido'} desconectado.`);
    });
  

    // ------------------------------------------ Manejo de mensajes para el chat ---------------------------------------
    // Manejar el envío de mensajes
    socket.on('sendMessage', async ({ senderId, receiverId, contenido }) => {
      try {
        
        const fechaHoraActual = format(new Date(), 'yyyy-MM-dd HH:mm');
        
        // Crear y guardar el mensaje en la base de datos
        const newMessage = await Message.create({
          senderId,
          receiverId,
          contenido,
          fechaHora: fechaHoraActual,
          sent: true,
          read: false,
        });
  
        // Enviar el mensaje al emisor para mostrarlo localmente
        emitMessage(socket, newMessage);
  
        // Encontrar el socket del receptor
        const targetSocket = getSocketByUserId(receiverId);
  
        if (targetSocket) {
          // Enviar el mensaje al receptor
          emitMessage(targetSocket[1], newMessage);
        } else {
          console.log(`Usuario con id ${receiverId} no está conectado.`);
        }
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
      }
    });
  
    // Manejar cuando el receptor se conecta
    socket.on('getUnreadMessages', async ({ receiverId, senderId }) => {
      try {
        const unreadMessages = await Message.findAll({
          where: {
            receiverId: receiverId,
            senderId: senderId,
            read: false,
          },
        });
        
        socket.emit('unreadMessages', unreadMessages);
      } catch (error) {
        console.error('Error al obtener mensajes no leídos:', error);
      }
    });
  
    // Marcar un mensaje como leído
    socket.on('messageRead', async ({ messageId }) => {
      try {
        const message = await Message.findByPk(messageId);
        if (message) {
          await message.update({ read: true });
  
          // Emitir el evento 'messageRead' al receptor
          socket.emit('messageRead', { messageId: message.id, read: true });
  
          // Emitir el evento 'messageRead' al remitente si está conectado
          const senderSocket = getSocketByUserId(message.senderId);
          if (senderSocket) {
            senderSocket[1].emit('messageRead', { messageId: message.id, read: true });
          }
        }
      } catch (error) {
        console.error('Error al actualizar el estado del mensaje:', error);
      }
    });

    // ------------------------------------------ Manejo de geolocalizcion ---------------------------------------
    
    // Crear una sala privada
    socket.on('createRoom', ({ roomName, userId }) => {
      socket.join(roomName); // Añadir al usuario (paseador) a la sala
      console.log(`Usuario ${userId} ha creado la sala ${roomName}`);
    });

    // Permitir que otros usuarios se unan a la sala privada
    socket.on('joinRoom', ({ roomName, userId }) => {
      socket.join(roomName);
      console.log(`Usuario ${userId} se ha unido a la sala ${roomName}`);
    });
    
    //Salir y eliminar sala
    socket.on('leaveRoom', ({ roomName, userId }) => {
      socket.leave(roomName);
      console.log(`Usuario ${userId} ha salido de la sala ${roomName}`);
    });

  
    // Recibir una nueva ubicación
    socket.on('newLocation', async ({roomName, lat, long, walkerId}) => {
      const fechaActual = format(new Date(), 'yyyy-MM-dd');
      const fechaHoraActual = format(new Date(), 'yyyy-MM-dd HH:mm');
      try {
          // Verifico si el paseador ya tiene una ubicación
          const existingLocation = await Location.findOne({ where: { WalkerId: walkerId } });

          let location;

          if (existingLocation) {
            // si ya existe la modifico
            location = await existingLocation.update({ lat, long, fechaHora: fechaHoraActual });
          } else {
            // si no existe la creo
            location = await Location.create({ WalkerId: walkerId, lat, long, fechaHora: fechaHoraActual });
          }
          io.to(roomName).emit('receiveLocation', location);
          console.log(`Usuario ${socket.userId} ha enviado la ubicación a la sala ${roomName}`);
        
      } catch (error) {
        console.error('Error al actualizar la ubicacion:', error);
      }
    });
  });
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado');
  }
  return io;
}

module.exports = { setupWebSocket, getIO, getSocketByUserId };