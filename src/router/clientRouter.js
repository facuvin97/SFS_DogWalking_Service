const Client = require("../models/Client")
const User = require("../models/User")
const sequelize = require('../config/db.js');
const Pet = require('../models/Pet');

const router = require("express").Router()

router.get("/clients", async (req, res) => {
  const clients = await Client.findAll({
    include: User
  })
  res.status(200).json({
    ok: true,
    status: 200,
    body: clients
  })
})

router.get("/clients/:client_id", async (req, res) => {
  const id = req.params.client_id;
  const client = await Client.findOne({
    where: {
      id: id
    },
    include: User
  })
  res.status(200).json({
    ok: true,
    status: 200,
    body: client
  })
})

router.post("/clients", async (req, res) => {
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
    const client = await Client.create({
      id: user.id // Asigna el ID del usuario recién creado
    }, { transaction: t });
    res.status(201).json({
      ok: true,
      status: 201,
      message: "Cliente creado exitosamente",
    });
  }).catch((error) => {
    // Si algo falla, revierte la transacción
    res.status(500).send('Error al crear cliente');
    console.error('Error al crear usuario y cliente:', error);
  });
})

router.put("/clients/:client_id", async (req, res) => {
  try {
    const id = req.params.client_id
    const userData = req.body
    const updateClient = await User.update(
      {
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
        where: {
          id: id
        }
      }
    )
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Cliente modificado exitosamente",
    })
  } catch (error) {
      res.status(500).send('Error al modificar cliente')
      console.error('Error al modificar cliente:', error)
  }
})

router.delete("/clients/:client_id", async (req, res) => {
  sequelize.transaction(async (t) => {
    const id = req.params.client_id

    const deleteClient = await Client.destroy({
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
    if (deleteClient && deleteUser != 0)
    {
      res.status(200).json({
        ok: true,
        status: 200,
        message: "Cliente eliminado exitosamente",
      });
    } else {
      res.status(500).json({
        ok: false,
        status: 500,
        message: "No se encontro el cliente",
      });
    }
  }).catch((error) => {
    // Si algo falla, revierte la transacción
    res.status(500).send('Error al eliminar cliente');
    console.error('Error al eliminar cliente:', error);
  });
})

router.get("/clients/:client_id/pets", async (req, res) => {
  const clientId = req.params.client_id;

  try {
    const pets = await Pet.findAll({
      where: {
        clientId: clientId
      }
    });

    if (pets.length === 0) {
      res.status(404).json({
        ok: false,
        status: 404,
        message: "No se encontraron mascotas para este dueño"
      });
    } else {
      res.status(200).json({
        ok: true,
        status: 200,
        body: pets
      });
    }
  } catch (error) {
    console.error('Error al obtener las mascotas:', error);
    res.status(500).send('Error al obtener las mascotas');
  }
});


module.exports = router