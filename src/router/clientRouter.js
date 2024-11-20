const Client = require("../models/Client");
const User = require("../models/User");
const sequelize = require("../config/db.js");
const Pet = require("../models/Pet");
const Walker = require("../models/Walker.js");
const Turn = require("../models/Turn.js");
const Service = require("../models/Service.js");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");

const router = require("express").Router();

// Obtener todos los clientes
router.get("/clients", authMiddleware, async (req, res) => {
  const clients = await Client.findAll({
    include: User,
  });
  res.status(200).json({
    ok: true,
    status: 200,
    body: clients,
  });
});

// Obtener un cliente por su ID
router.get("/clients/:client_id", authMiddleware, async (req, res) => {
  const id = req.params.client_id;
  const client = await Client.findOne({
    where: {
      id: id,
    },
    include: User,
  });
  res.status(200).json({
    ok: true,
    status: 200,
    data: client,
  });
});

// login client para mobile
router.post("/login/client", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Busca el usuario por su nombre de usuario en la base de datos
    const user = await User.findOne({
      where: {
        nombre_usuario: username,
      },
    });

    var contraseniaCoincide = false;
    if (user)
      contraseniaCoincide = bcrypt.compareSync(password, user.contraseña);

    // Si no se encuentra el usuario o la contraseña no coincide, responde con un error de autenticación
    if (!user || !contraseniaCoincide) {
      return res
        .status(401)
        .json({ ok: false, message: "Usuario y/o contraseña incorrecta" });
    }

    const client = await Client.findByPk(user.id);
    if (client === null)
      return res
        .status(401)
        .json({ ok: false, message: "Usuario no es cliente" });
    loggedUser = user.toJSON();
    // Si el usuario y la contraseña son correctos, devuelves el usuario encontrado
    res.status(200).json({
      ok: true,
      loggedUser,
      token: jwt.sign({ userId: user.id }, process.env.JWT_SECRET),
    });
  } catch (error) {
    console.error("Error de autenticación:", error);
    res.status(500).json({ ok: false, message: "Error de autenticación" });
  }
});

// Obtener un cliente por su ID
router.get("/clients/body/:client_id", authMiddleware, async (req, res) => {
  const id = req.params.client_id;
  const client = await Client.findOne({
    where: {
      id: id,
    },
    include: User,
  });
  res.status(200).json({
    ok: true,
    status: 200,
    body: client,
  });
});

// Crear un cliente
router.post("/clients", async (req, res) => {
  sequelize
    .transaction(async (t) => {
      const userData = req.body;
      password = bcrypt.hashSync(userData.contraseña, 10);

      // Crea el usuario
      const user = await User.create(
        {
          nombre_usuario: userData.nombre_usuario,
          contraseña: password,
          direccion: userData.direccion,
          fecha_nacimiento: userData.fecha_nacimiento,
          email: userData.email,
          telefono: userData.telefono,
        },
        { transaction: t }
      );

      // Crea el cliente asociado al usuario recién creado
      const client = await Client.create(
        {
          id: user.id, // Asigna el ID del usuario recién creado
        },
        { transaction: t }
      );

      res.status(201).json({
        ok: true,
        status: 201,
        message: "Cliente creado exitosamente",
        body: client.id,
      });
    })
    .catch((error) => {
      // Si algo falla, revierte la transacción
      res.status(500).json({
        ok: false,
        status: 500,
        message: "Error al crear cliente",
        error: error.errors[0].message,
      });
      console.error("Error al crear cliente :", error);
    });
});

// Actualizar un cliente
router.put("/clients/:client_id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.client_id;
    const userData = req.body;
    const updateClient = await User.update(
      {
        foto: userData.foto,
        nombre_usuario: userData.nombre_usuario,
        contraseña: userData.contraseña,
        direccion: userData.direccion,
        fecha_nacimiento: userData.fecha_nacimiento,
        email: userData.email,
        telefono: userData.telefono,
        calificacion: userData.calificacion,
      },
      {
        where: {
          id: id,
        },
      }
    );
    res.status(200).json({
      ok: true,
      status: 200,
      message: "Cliente modificado exitosamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al crear paseador",
      error: error.errors[0].message,
    });
    console.error("Error al crear paseador:", error);
  }
});

// Eliminar un cliente
router.delete("/clients/:client_id", authMiddleware, async (req, res) => {
  sequelize
    .transaction(async (t) => {
      const id = req.params.client_id;

      const deleteClient = await Client.destroy({
        where: {
          id: id,
        },
        transaction: t,
      });

      const deleteUser = await User.destroy({
        where: {
          id: id,
        },
        transaction: t,
      });
      if (deleteClient && deleteUser != 0) {
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
    })
    .catch((error) => {
      // Si algo falla, revierte la transacción
      res.status(500).send("Error al eliminar cliente");
      console.error("Error al eliminar cliente:", error);
    });
});

// Obtener todos los mascotas de un cliente
router.get("/clients/:client_id/pets", authMiddleware, async (req, res) => {
  const clientId = req.params.client_id;

  try {
    const pets = await Pet.findAll({
      where: {
        clientId: clientId,
      },
    });

    if (pets.length === 0) {
      res.status(404).json({
        ok: false,
        status: 404,
        message: "No se encontraron mascotas para este dueño",
      });
    } else {
      res.status(200).json({
        ok: true,
        status: 200,
        body: pets,
      });
    }
  } catch (error) {
    console.error("Error al obtener las mascotas:", error);
    res.status(500).send("Error al obtener las mascotas");
  }
});

module.exports = router;
