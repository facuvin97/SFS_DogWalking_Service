const Client = require("../models/Client")
const User = require("../models/User")

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
  try {
    const userData = req.body

    const newClient = await Client.create({
      user: {
        foto: userData.foto,
        nombre_usuario: userData.nombre_usuario,
        contraseña: userData.contraseña,
        direccion: userData.direccion,
        fecha_nacimiento: userData.fecha_nacimiento,
        email: userData.email,
        telefono: userData.telefono,
        calificacion: userData.calificacion
        }
    }, {
      include: [{
        association: Client.User
      }]
    });

    res.status(201).json({
      ok: true,
      status: 201,
      message: "Cliente creado exitosamente",
      body: {
        user: newUser,
        client: newClient
      }
    });
  } catch (error) {
    console.error("Error al crear el cliente:", error);
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al crear el cliente"
    });
  }
})

router.put("/clients/:client_id", (req, res) => {
  res.send("Modificar")
})

router.delete("/clients/:client_id", (req, res) => {
  res.send("Eliminar")
})

module.exports = router