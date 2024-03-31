const User = require("../models/User")
const Walker = require("../models/Walker")
const sequelize = require('../config/db.js');
const router = require("express").Router()

router.get("/walkers", async (req, res) => {
  const walkers = await Walker.findAll({
    include: User
  })
  res.status(200).json({
    ok: true,
    status: 200,
    body: walkers
  })
})

router.get("/walkers/:walker_id", async (req, res) => {
  const id = req.params.walker_id;
  const walker = await Walker.findOne({
    where: {
      id: id
    },
    include: User
  })
  res.status(200).json({
    ok: true,
    status: 200,
    body: walker
  })
})

router.post("/walkers", (req, res) => {
  sequelize.transaction(async (t) => {
    const userData = req.body

    // Crea el usuario
    const user = await User.create({
      foto: userData.foto,
      nombre_usuario: userData.nombre_usuario,
      contraseña: userData.contraseña,
      direccion: userData.direccion,
      fecha_nacimiento: userData.fecha_nacimiento,
      email: userData.email,
      telefono: userData.telefono,
      calificacion: userData.calificacion
    }, { transaction: t });
  
    // Crea el cliente asociado al usuario recién creado
    const walker = await Walker.create({
      id: user.id, // Asigna el ID del usuario recién creado
      fotos: userData.fotos
    }, { transaction: t });
    res.status(201).json({
      ok: true,
      status: 201,
      message: "Paseador creado exitosamente",
    });
  }).catch((error) => {
    // Si algo falla, revierte la transacción
    res.status(500).send('Error al crear paseador');
    console.error('Error al crear paseador:', error);
  });
})

router.put("/walkers/:walker_id", (req, res) => {
  sequelize.transaction(async (t) => {
    const userData = req.body
    const id = req.params.walker_id

    // Modifico el usuario
    const user = await User.update({
      foto: userData.foto,
      nombre_usuario: userData.nombre_usuario,
      contraseña: userData.contraseña,
      direccion: userData.direccion,
      fecha_nacimiento: userData.fecha_nacimiento,
      email: userData.email,
      telefono: userData.telefono,
      calificacion: userData.calificacion
    }, 
    { 
      transaction: t,
      where: {
        id: id
      }
    });
  
    // modifica el paseador asociado al usuario
    const walker = await Walker.update({
      fotos: userData.fotos
    }, 
    { 
      transaction: t,
      where: {
        id: id
      }
    });
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Paseador modificado exitosamente",
    });
  }).catch((error) => {
    // Si algo falla, revierte la transacción
    res.status(500).send('Error al modificar paseador');
    console.error('Error al modificar paseador:', error);
  });
})

router.delete("/walkers/:walker_id", (req, res) => {
  sequelize.transaction(async (t) => {
    const userData = req.body
    const id = req.params.walker_id

    const deleteWalker = await Walker.destroy({
      where: {
        id: id
      },
      transaction: t
    })

    const deleteUser = await User.destroy({
      where: {
        id: id
      },
      transaction: t
    })
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Paseador eliminado exitosamente",
    });
  }).catch((error) => {
    // Si algo falla, revierte la transacción
    res.status(500).send('Error al eliminar paseador');
    console.error('Error al eliminar paseador:', error);
  });
})

module.exports = router