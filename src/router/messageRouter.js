const User = require("../models/User");
const Message = require("../models/Message.js");
const { Op } = require("sequelize");
const Client = require("../models/Client.js");
const Walker = require("../models/Walker.js");
const Service = require("../models/Service.js");
const Turn = require("../models/Turn.js");

const router = require("express").Router();

// obtener un mensaje por su id
router.get("/messages/single/:messageId", async (req, res) => {
  try {
    const id = req.params.messageId;
    const message = await Message.findByPk(id, {
      attributes: ["id", "createdAt", "senderId", "receiverId"],
    });
    if (!message) {
      res.status(404).json({ ok: false, error: "Mensaje no encontrado" });
      return;
    }
    res.status(200).json({
      ok: true,
      status: 200,
      body: message,
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

// Obtener las mensages de un usuario vinculado a otro
router.get("/messages/:senderId/:reciverId", async (req, res) => {
  try {
    const id1 = req.params.senderId;
    const id2 = req.params.reciverId;

    // comprobar que los dos ids sean validos
    const user1 = await User.findByPk(id1);
    const user2 = await User.findByPk(id2);

    if (!user1 || !user2) {
      res.status(404).json({ ok: false, error: "Usuario no encontrado" });
      return;
    }

    // filtrar mensajes entre los dos usuarios
    const messages = await Message.findAll({
      where: {
        // Se busca cuando senderId y receiverId coincidan en ambos sentidos
        [Op.or]: [
          { senderId: id1, receiverId: id2 },
          { senderId: id2, receiverId: id1 },
        ],
      },
      order: [["createdAt", "ASC"]], // Ordenar por fecha de creación (opcional)
    });
    res.status(200).json({
      ok: true,
      status: 200,
      body: messages,
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

// Obtener todos los usuarios que tienen mensajes con un usuario específico
router.get("/contacts/clients/:userId", async (req, res) => {
  const userId = req.params.userId; // Este es el ID del walker

  try {
    // Obtener todos los mensajes donde el walker es el remitente o el destinatario
    const messages = await Message.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
      attributes: ["senderId", "receiverId"],
    });

    // Obtener los IDs únicos de clientes que tienen mensajes
    const messageContactIds = new Set();
    messages.forEach((msg) => {
      if (msg.senderId !== userId) {
        messageContactIds.add(msg.senderId); // Agregar el remitente
      }
      if (msg.receiverId !== userId) {
        messageContactIds.add(msg.receiverId); // Agregar el destinatario
      }
    });

    // Obtener todos los clientes que solicitaron un servicio en los turnos del walker
    const serviceClients = await Client.findAll({
      include: [
        { model: User }, // Incluir al usuario asociado con el cliente
        {
          model: Service,
          required: true,
          attributes: [], // No incluir campos de Service
          include: {
            model: Turn,
            paranoid: false,
            required: true, // Incluir el turno asociado con el servicio
            attributes: [], // No incluir campos de Turn
            where: { walkerId: userId }, // Filtro por el walker logueado
          },
        },
      ],
    });

    // Crear un Set para almacenar todos los IDs únicos de clientes
    const allClientIds = new Set([...messageContactIds]);
    serviceClients.forEach((client) => allClientIds.add(client.id));

    // Obtener detalles completos de los clientes únicos
    const uniqueClients = await Client.findAll({
      where: { id: Array.from(allClientIds) },
      attributes: ["id"],
      include: {
        model: User, // Incluir al usuario asociado
        attributes: ["id", "foto", "nombre_usuario"],
      },
    });

    // Para cada cliente, buscar el último mensaje con el walker
    const clientsWithLastMessage = await Promise.all(
      uniqueClients.map(async (client) => {
        const lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { senderId: userId, receiverId: client.id },
              { senderId: client.id, receiverId: userId },
            ],
          },
          attributes: ["id", "createdAt", "senderId", "receiverId", "read"],
          order: [["createdAt", "DESC"]], // Ordenar por fecha más reciente
          limit: 1, // Obtener solo el último mensaje
        });

        const lastMessageReceived = await Message.findOne({
          where: { senderId: client.id, receiverId: userId },
          attributes: ["id", "createdAt", "senderId", "receiverId", "read"],
          order: [["createdAt", "DESC"]], // Ordenar por fecha más reciente
          limit: 1, // Obtener solo el último mensaje
        });

        // Agregar el último mensaje como un campo adicional en el cliente
        return {
          ...client.toJSON(), // Convertimos el modelo Sequelize a un objeto plano
          lastMessage: lastMessage || null, // Si no hay mensaje, retorna null
          lastMessageReceived: lastMessageReceived || null, // Si no hay mensaje recibido, retorna null
        };
      })
    );

    // Ordenar la lista de clientes por la fecha del último mensaje
    const sortedClients = clientsWithLastMessage.sort((a, b) => {
      const dateA = a.lastMessage ? a.lastMessage.createdAt : null;
      const dateB = b.lastMessage ? b.lastMessage.createdAt : null;

      // Comparar las fechas
      return dateB - dateA; // Ordenar de más reciente a más antiguo
    });

    res.status(200).json({
      ok: true,
      status: 200,
      body: sortedClients,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al obtener los clientes",
      error: error.message,
    });
    console.error("Error al obtener los clientes:", error);
  }
});

router.get("/contacts/walkers/:userId", async (req, res) => {
  const userId = req.params.userId; // Este es el ID del cliente

  try {
    // Obtener todos los mensajes donde el usuario es el remitente o el destinatario
    const messages = await Message.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
      attributes: ["senderId", "receiverId"],
    });

    // Obtener los IDs únicos de walkers con los que el usuario ha tenido mensajes
    const messageWalkerIds = new Set();
    messages.forEach((msg) => {
      if (msg.senderId !== userId) {
        messageWalkerIds.add(msg.senderId); // Agregar el remitente (si no es el usuario)
      }
      if (msg.receiverId !== userId) {
        messageWalkerIds.add(msg.receiverId); // Agregar el destinatario (si no es el usuario)
      }
    });

    // Obtener todos los walkers que prestaron un servicio solicitado por el cliente
    const serviceWalkers = await Walker.findAll({
      include: [
        {
          model: Turn, // Relación del paseador con el turno
          paranoid: false,
          required: true,
          attributes: [], // No incluir campos de Turn
          include: {
            model: Service, // El turno está asociado con un servicio
            required: true,
            attributes: [], // No incluir campos de Service
            where: { clientId: userId }, // Filtro por el cliente logueado
          },
        },
      ],
    });

    // Crear un Set para almacenar todos los IDs únicos de walkers
    const allWalkerIds = new Set();

    // Agregar IDs de walkers con mensajes
    messageWalkerIds.forEach((id) => allWalkerIds.add(id));

    // Agregar IDs de walkers con servicios
    serviceWalkers.forEach((walker) => allWalkerIds.add(walker.id));

    // Obtener detalles completos de los walkers únicos
    const uniqueWalkers = await Walker.findAll({
      where: {
        id: Array.from(allWalkerIds), // Filtrar por los IDs únicos
      },
      attributes: ["id"],
      include: {
        model: User, // Incluir al usuario asociado
        attributes: ["id", "foto", "nombre_usuario"],
      },
    });

    // Para cada walker, buscar el último mensaje con el client
    const walkersWithLastMessage = await Promise.all(
      uniqueWalkers.map(async (walker) => {
        const lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { senderId: userId, receiverId: walker.id },
              { senderId: walker.id, receiverId: userId },
            ],
          },
          attributes: ["id", "createdAt", "senderId", "receiverId"],
          order: [["createdAt", "DESC"]], // Ordenar por fecha más reciente
          limit: 1, // Obtener solo el último mensaje
        });

        // Agregar el último mensaje como un campo adicional en el cliente
        return {
          ...walker.toJSON(), // Convertimos el modelo Sequelize a un objeto plano
          lastMessage: lastMessage || null, // Si no hay mensaje, retorna null
        };
      })
    );

    // Ordenar la lista de clientes por la fecha del último mensaje
    const sortedWalkers = walkersWithLastMessage.sort((a, b) => {
      const dateA = a.lastMessage ? a.lastMessage.createdAt : null;
      const dateB = b.lastMessage ? b.lastMessage.createdAt : null;

      // Comparar las fechas
      return dateB - dateA; // Ordenar de más reciente a más antiguo
    });

    res.status(200).json({
      ok: true,
      status: 200,
      body: sortedWalkers,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al obtener los walkers",
      error: error.message,
    });
    console.error("Error al obtener los walkers:", error);
  }
});

router.get("/unread/:userId", async (req, res) => {
  const userId = req.params.userId; // Este es el ID del usuario

  try {
    const user1 = await User.findByPk(userId);
    if (!user1) {
      res.status(404).json({ ok: false, error: "Usuario no encontrado" });
      return;
    }
    // Obtener todos los mensajes no leidos del usuario
    const unreadMessages = await Message.findAll({
      where: {
        [Op.and]: [{ read: false }, { receiverId: userId }],
      },
      order: [["createdAt", "DESC"]], // Ordenar por fecha de creación (opcional)
    });

    res.status(200).json({
      ok: true,
      status: 200,
      body: unreadMessages,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al obtener los mensajes no leidos",
      error: error.message,
    });
    console.error("Error al obtener los mensajes no leidos:", error);
  }
});

module.exports = router;
