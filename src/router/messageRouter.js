const User = require("../models/User")
const Message = require("../models/Message.js")
const { Op } = require('sequelize');
const Client = require("../models/Client.js");
const Service = require("../models/Service.js");
const Turn = require("../models/Turn.js");


const router = require("express").Router()


// Obtener las mensages de un usuario vinculado a otro
router.get('/messages/:senderId/:reciverId', async (req, res) => {
  try {

    const id1 = req.params.senderId;
    const id2 = req.params.reciverId;

    // comprobar que los dos ids sean validos
    const user1 = await User.findByPk(id1);
    const user2 = await User.findByPk(id2);

    if (!user1 || !user2) {
      res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
      return;
    }

    // filtrar mensajes entre los dos usuarios
    const messages = await Message.findAll({
      where: {
        // Se busca cuando senderId y receiverId coincidan en ambos sentidos
        [Op.or]: [
          { senderId: id1, receiverId: id2 },
          { senderId: id2, receiverId: id1 }
        ]
      },
      order: [['createdAt', 'ASC']] // Ordenar por fecha de creación (opcional)
    });
    
    res.status(200).json({
      ok: true,
      status: 200,
      body: messages
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

// Obtener todos los usuarios que tienen mensajes con un usuario específico
router.get("/contacts/:userId", async (req, res) => {
  const userId = req.params.userId; // Este es el ID del walker

  try {
    // Obtener todos los mensajes donde el walker es el remitente o el destinatario
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ],
      },
      attributes: ['senderId', 'receiverId'],
    });

    // Obtener los IDs únicos de clientes que tienen mensajes
    const messageContactIds = new Set();
    messages.forEach(msg => {
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
        {
          model: User, // Incluir al usuario asociado con el cliente
        },
        {
          model: Service,
          required: true,
          attributes: [], // No incluir campos de Service
          include: {
            model: Turn,
            required: true, // Incluir el turno asociado con el servicio
            attributes: [], // No incluir campos de Turn
            where: { walkerId: userId }, // Filtro por el walker logueado
          },
        },
      ],
    });

    // Crear un Set para almacenar todos los IDs únicos de clientes
    const allClientIds = new Set();

    // Agregar IDs de clientes con mensajes
    messageContactIds.forEach(id => allClientIds.add(id));

    // Agregar IDs de clientes con servicios
    serviceClients.forEach(client => allClientIds.add(client.id));

    // Obtener detalles completos de los clientes únicos
    const uniqueClients = await Client.findAll({
      where: {
        id: Array.from(allClientIds) // Filtrar por los IDs únicos
      },
      include: {
        model: User, // Incluir al usuario asociado
      }
    });

    res.status(200).json({
      ok: true,
      status: 200,
      body: uniqueClients,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: 'Error al obtener los clientes',
      error: error.message,
    });
    console.error('Error al obtener los clientes:', error);
  }
});







module.exports = router