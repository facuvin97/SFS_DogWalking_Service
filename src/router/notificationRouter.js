const User = require("../models/User")
const Notification = require("../models/Notification.js")
const sequelize = require('../config/db.js');
const { Op } = require('sequelize');
const { getSocketByUserId } = require('../config/socket.js');


const router = require("express").Router()


// Crear notificacion
router.post("/notifications", async (req, res) => {
  try {
    const notificationData = req.body;
      // Obtener la fecha y hora actual
    const fechaHoraActual = new Date();
    // Restar 3 horas
    fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);
  
    // Formatear la fecha a 'yyyy-MM-dd HH:mm'
    const formattedFechaHoraActual = fechaHoraActual.toISOString()
      .slice(0, 16) // 'yyyy-MM-ddTHH:mm'
      .replace('T', ' '); // Cambia 'T' por un espacio
  

    const notification = await Notification.create({
      titulo: notificationData.titulo,
      contenido: notificationData.contenido,
      fechaHora: formattedFechaHoraActual,
      leido: notificationData.leido,
      userId: notificationData.userId
    });

    const targetSocket = getSocketByUserId(notificationData.userId);
    if (targetSocket) {
      targetSocket.emit('notification', notification.toJSON());
    }

    res.status(201).json({
      ok: true,
      status: 201,
      message: "Notificación creada exitosamente",
      data: notification
    });
  } catch (error) {
    res.status(500).send('Error al crear notificacion');
    console.error('Error al crear notificacion:', error);
  }
});

// Obtener las notificaciones de un usuario
router.get('/notifications/:userId', async (req, res) => {
  try {
    // Calcular la fecha de hace 30 días
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    // Formatear la fecha a 'yyyy-MM-dd HH:mm'
    const formattedThirtyDaysAgo = thirtyDaysAgo.toISOString()
      .slice(0, 16) // 'yyyy-MM-ddTHH:mm'
      .replace('T', ' '); // Cambia 'T' por un espacio

    // filtrar la notificaciones recibidas en los ultimos 30 dias
    const notifications = await Notification.findAll({
      where: {
        userId: req.params.userId,
        fechaHora: {
          [Op.gte]: formattedThirtyDaysAgo 
        }
      },
      order: [['fechaHora', 'DESC']],
      limit: 25,
    });
    
    res.status(200).json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Marcar una notificacion como leida
router.put('/notifications/:id', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (notification) {
      notification.leido = true;
      await notification.save();
      res.status(200).json(notification);
    } else {
      res.status(404).json({ error: 'Notificacion no encontrada' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});




module.exports = router