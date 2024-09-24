const app = require("./app/app"); // Tu aplicación Express
const http = require('http'); // Para crear el servidor HTTP
const { Server } = require('socket.io'); // Para usar WebSocket
const sequelize = require("./config/db");
const Client = require("./models/Client");
const Message = require("./models/Message");
const User = require("./models/User");
const Walker = require("./models/Walker");
const associations = require('./models/associations');
const { format } =require( 'date-fns');

const port = process.env.PORT || 3001


// Obtener todos los nombres de los modelos definidos
const modelNames = Object.keys(sequelize.models);

// Filtrar los modelos que son subclases de Sequelize.Model
const modelosSequelize = modelNames.filter(modelName => {
  const modelo = sequelize.models[modelName];
  return modelo.prototype instanceof sequelize.Sequelize.Model;
});

// Crear el servidor HTTP utilizando tu app actual de Express
const server = http.createServer(app);

// Configurar socket.io para manejar WebSocket
const io = new Server(server, {
  cors: {
    origin: '*', // Configurar orígenes permitidos (ajusta según tu necesidad)
  },
});

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  // Manejar el envío de mensajes
  socket.on('sendMessage', async ({ senderId, receiverId, contenido }) => {
    try {
      // Obtener la fecha y hora actual
      const fechaHoraActual = format(new Date(), 'yyyy-MM-dd HH:mm');
      
      // Crear y guardar el mensaje en la base de datos
      const newMessage = await Message.create({
        senderId,
        receiverId,
        contenido,
        fechaHora: fechaHoraActual,
      });

      // Enviar el mensaje al emisor para mostrarlo localmente
      socket.emit('receiveMessage', {
        senderId,
        receiverId,
        contenido: newMessage.contenido,
      });

      // Encontrar el socket del receptor usando receiverId
      const targetSocket = Array.from(io.sockets.sockets)
        .find(([id, s]) => (s.handshake.auth.userId).toString() === receiverId.toString());

      if (targetSocket) {
        // Enviar el mensaje al receptor
        targetSocket[1].emit('receiveMessage', {
          senderId,
          receiverId,
          contenido: newMessage.contenido,
        });
      } else {
        console.log(`Usuario con id ${receiverId} no está conectado.`);
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  });

  // Manejar la desconexión del cliente
  socket.on('disconnect', () => {
    console.log(`Usuario ${socket.userId || 'desconocido'} desconectado.`);
  });
});

// Función para limpiar índices redundantes
async function cleanupIndexes() {
  try {
    for (const modelName of modelosSequelize) {
      const model = sequelize.models[modelName];
      const tableName = model.getTableName();

      // Mostrar los índices existentes para la tabla
      const [results] = await sequelize.query(`SHOW INDEX FROM ${tableName}`);

      // Filtrar índices que no sean la clave primaria y agrupar por nombre de columna
      const indices = results.filter(index => index.Key_name !== 'PRIMARY');
      const indicesMap = new Map();

      indices.forEach(index => {
        if (!indicesMap.has(index.Column_name)) {
          indicesMap.set(index.Column_name, []);
        }
        indicesMap.get(index.Column_name).push(index.Key_name);
      });

      // Eliminar índices redundantes, manteniendo solo uno por columna
      for (const [columnName, keyNames] of indicesMap.entries()) {
        // Mantener el primer índice y eliminar los demás
        for (let i = 1; i < keyNames.length; i++) {
          const keyName = keyNames[i];
          try {
            await sequelize.query(`DROP INDEX ${keyName} ON ${tableName}`);
            console.log(`Eliminado índice ${keyName} en la tabla ${tableName}`);
          } catch (error) {
            console.error(`Error al eliminar índice ${keyName} en la tabla ${tableName}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error al limpiar índices:', error);
  }
}

// Sincronizar base de datos y añadir la funcionalidad de WebSocket
async function initDatabase() {
  try {
    await cleanupIndexes();
    await sequelize.sync({ alter: false }); // Opción 'alter' para sincronización no destructiva
    console.log('¡Tablas sincronizadas!');
  } catch (error) {
    console.error('Error durante la inicialización:', error);
  }
}

// Iniciar la base de datos y levantar el servidor HTTP + WebSocket
initDatabase().then(() => {
  console.log('Índices limpiados y base de datos sincronizada.');
  
  // Levantar el servidor en el puerto 3000 (puedes cambiarlo si es necesario)
  server.listen(port, () => {
    console.log('Servidor escuchando en el puerto 3001 con WebSocket habilitado.');
  });

}).catch(error => {
  console.error('Error durante la inicialización:', error);
});
