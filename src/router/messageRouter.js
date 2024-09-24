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





module.exports = router