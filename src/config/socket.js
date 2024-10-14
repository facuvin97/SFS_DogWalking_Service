const Message = require("../models/Message.js");
const { format } =require( 'date-fns');
const Service = require("../models/Service.js");
const Turn = require("../models/Turn.js");
const Location = require("../models/Location.js");

let io;

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

  // Función auxiliar para obtener el socket de un usuario por userId
  function getSocketByUserId(userId) {
    return Array.from(io.sockets.sockets)
      .find(([id, s]) => s.handshake.auth.userId.toString() === userId.toString());
  }
  
  // Configurar socket.io para manejar WebSocket
  io = new Server(server, {
    cors: {
      origin: '*', // Configurar orígenes permitidos (ajusta según tu necesidad)
    },
  });

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

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
    // Recibir una nueva ubicación
    socket.on('newLocation', async ({lat, long, turnId}) => {
      const fechaActual = format(new Date(), 'yyyy-MM-dd');
      const fechaHoraActual = format(new Date(), 'yyyy-MM-dd HH:mm');
      try {
        //busco el servicio incluyendo el turno
        const turn = await Turn.findByPk(turnId);

        // si no lo encuentro, tiro error
        if (!turn) {
          throw new Error('El turno no existe');
        }

        if (turn) {
          const walkerId = turn.WalkerId;

          // Verifico si el paseador ya tiene una ubicación
          const existingLocation = await Location.findOne({ where: { walkerId: walkerId } });

          let location;

          if (existingLocation) {
            // si ya existe la modifico
            location = await existingLocation.update({ lat, long, fechaHora: fechaHoraActual });
          } else {
            // si no existe la creo
            location = await Location.create({ walkerId, lat, long, fechaHora: fechaHoraActual });
          }

          // Busco todos los clientes con un servicio comenzado en el turno para hoy
          const services = await Service.findAll({
            where: {
              TurnId: turnId,
              comenzado: true,
              finalizado: false,
              fecha: {
                [Op.eq]: fechaActual
              }
            }
          });
  
          // si no hay servicios, no emito nada
          if (!services.length) {
            return;
          }

          // Emitir el evento 'sendNewLocation' a todos los clientes de la lista de servicios
          services.forEach(async (service) => {
            const client = await User.findByPk(service.ClientId);
            if (client) {
              const clientSocket = getSocketByUserId(client.id);
              if (clientSocket) {
                clientSocket[1].emit('sendNewLocation', location);
              }
            }
          });
        }
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

module.exports = { setupWebSocket, getIO };