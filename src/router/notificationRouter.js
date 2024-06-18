const User = require("../models/User")
const Notification = require("../models/Notification.js")
const sequelize = require('../config/db.js');
const { Op } = require('sequelize');


const router = require("express").Router()


// Crear notificacion
router.post("/notifications", async (req, res) => {
  try {
    console.log('Entro al post')
    const notificationData = req.body;

    const notification = await Notification.create({
      titulo: notificationData.titulo,
      contenido: notificationData.contenido,
      fechaHora: notificationData.fechaHora,
      leido: notificationData.leido,
      userId: notificationData.userId
    });

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

    const notifications = await Notification.findAll({ 
      where: { 
        userId: req.params.userId,
        fechaHora: {
          [Op.gte]: thirtyDaysAgo // Obtener notificaciones de hace 30 días como máximo
        }
      } 
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