const User = require("../models/User")
const Message = require("../models/Message.js")
const { Op } = require('sequelize');


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

router.get('/contacts/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Comprobar que el userId es válido
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }

    // Buscar todos los mensajes donde el usuario haya sido el remitente o el destinatario
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      attributes: ['senderId', 'receiverId'], // Solo obtener senderId y receiverId
    });

    // Obtener los IDs únicos de los contactos, excluyendo el usuario actual
    const contactIds = new Set();
    messages.forEach(msg => {
      if (msg.senderId !== userId && msg.receiverId == userId) {
        contactIds.add(msg.senderId); // Agregar el remitente si no es el usuario actual
      }
      if (msg.receiverId !== userId && msg.senderId == userId) {
        contactIds.add(msg.receiverId); // Agregar el destinatario si no es el usuario actual
      }
    });

    // Si no se encontraron contactos, devolver una lista vacía
    if (contactIds.size === 0) {
      return res.status(200).json({ ok: true, status: 200, body: [] });
    }

    // Obtener los detalles de los contactos únicos encontrados, excluyendo el usuario actual
    const contacts = await User.findAll({
      where: {
        id: Array.from(contactIds)
      },
    });

    res.status(200).json({
      ok: true,
      status: 200,
      body: contacts,
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});





module.exports = router