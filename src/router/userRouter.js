const Client = require("../models/Client")
const User = require("../models/User")
const sequelize = require('../config/db.js');

const router = require("express").Router()

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Busca el usuario por su nombre de usuario en la base de datos
    const user = await User.findOne({ where: {
      nombre_usuario: username
    }, });

    // Si no se encuentra el usuario, responde con un error de autenticación
    if (!user) {
      return res.status(401).json({ ok: false, message: "Usuario no encontrado" });
    }

    // Comprueba si la contraseña coincide con la almacenada en la base de datos
    if (password !== user.contraseña) {
      return res.status(401).json({ ok: false, message: "Contraseña incorrecta" });
    }

    const client = await Client.findByPk(user.id);
    // Si no encontro el cliente, significa que es paseador
    var logedUser;
    if (client === null) {
      // Agrega un atributo 'tipo' al objeto del usuario
      logedUser = user.toJSON(); // Convertimos el modelo Sequelize a un objeto JSON
      logedUser.tipo = 'walker';
    } else {
      logedUser = user.toJSON(); 
      logedUser.tipo = 'client';
    }

    // Si el usuario y la contraseña son correctos, devuelves el usuario encontrado
    res.status(200).json({ ok: true, logedUser });
  } catch (error) {
    console.error("Error de autenticación:", error);
    res.status(500).json({ ok: false, message: "Error de autenticación" });
  }
});


// router.get("/users/:user_id", (req, res) => {
//   res.send("Obtener usuario")
// })

// router.post("/users", (req, res) => {
//   res.send("Agregar")
// })

// router.put("/users/:user_id", (req, res) => {
//   res.send("Modificar")
// })

// router.delete("/users/:user_id", (req, res) => {
//   res.send("Eliminar")
// })

 module.exports = router