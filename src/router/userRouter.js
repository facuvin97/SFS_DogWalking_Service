const Client = require("../models/Client");
const User = require("../models/User");
const Walker = require("../models/Walker");
const sequelize = require("../config/db.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");

const defaultImagePath = path.resolve(__dirname, "../../images/no_image.png");
const ruta = path.resolve(__dirname, "..", "..", "images");

const images = multer({
  dest: "images/",
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "images/");
    },
    filename: function (req, file, cb) {
      let finalName = "";

      if (req.params.nameImage) {
        finalName = req.params.nameImage + ".png";
      } else {
        const originalName = file.originalname;
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        //creo la variable fecha en formato yyyy-dd-MM hh:mm:ss
        const date = new Date().toISOString().slice(0, 19).replace(/:/g, "-");

        if (extension !== ".png" && extension !== ".jpg") {
          // si la extension no es jpg ni png, la hago png
          finalName = baseName + date + ".png";
        } else {
          // si es jpg o png la guardo con esa extension
          finalName = baseName + date + extension;
        }

        let counter = 1;

        while (fs.existsSync(path.join("images", finalName))) {
          finalName = `${baseName}_${counter}${extension}`;
          counter++;
        }
      }

      cb(null, finalName);
    },
  }),
});

const router = require("express").Router();

router.post("/login", async (req, res) => {
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
    // Si no encontro el cliente, significa que es paseador
    var logedUser;
    if (client === null) {
      // Agrega un atributo 'tipo' al objeto del usuario
      logedUser = user.toJSON(); // Convertimos el modelo Sequelize a un objeto JSON
      logedUser.tipo = "walker";
    } else {
      logedUser = user.toJSON();
      logedUser.tipo = "client";
    }

    // Si el usuario y la contraseña son correctos, devuelves el usuario encontrado
    res.status(200).json({
      ok: true,
      logedUser,
      token: jwt.sign({ userId: user.id }, process.env.JWT_SECRET),
    });
  } catch (error) {
    console.error("Error de autenticación:", error);
    res.status(500).json({ ok: false, message: "Error de autenticación" });
  }
});

// Modificar datos básicos del usuario (incluyendo la contraseña)
router.put("/users/password/:user_id", authMiddleware, async (req, res) => {
  try {
    const userData = req.body;
    const id = req.params.user_id; // Corregido el parámetro
    const newContraseña = userData.newContraseña
      ? bcrypt.hashSync(userData.newContraseña, 10)
      : null; // Solo generar hash si hay nueva contraseña
    const contraseña = userData.contraseña;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        ok: false,
        status: 404,
        message: "Usuario no encontrado",
      });
    }

    // Comparar contraseña actual
    const isMatch = await bcrypt.compare(contraseña, user.contraseña);
    if (!isMatch) {
      return res.status(400).json({
        ok: false,
        status: 400,
        message: "La contraseña actual no es correcta",
      });
    }

    // Modificar el usuario
    await User.update(
      {
        contraseña: newContraseña,
        direccion: userData.direccion,
        email: userData.email,
        telefono: userData.telefono,
      },
      {
        where: {
          id: id,
        },
      }
    );

    return res.status(200).json({
      ok: true,
      status: 200,
      message: "Usuario modificado exitosamente",
    });
  } catch (error) {
    console.error("Error al modificar usuario:", error);
    return res.status(500).json({
      ok: false,
      status: 500,
      message: error.message || "Error al modificar usuario",
      error: error.message || "Error inesperado",
    });
  }
});

// Modificar datos básicos del usuario (sin cambiar contraseña)
router.put("/users/:user_id", authMiddleware, async (req, res) => {
  try {
    const userData = req.body;
    const id = req.params.user_id; // Corregido el parámetro

    // Modificar el usuario
    await User.update(
      {
        direccion: userData.direccion,
        email: userData.email,
        telefono: userData.telefono,
      },
      {
        where: {
          id: id,
        },
      }
    );

    return res.status(200).json({
      ok: true,
      status: 200,
      message: "Usuario modificado exitosamente",
    });
  } catch (error) {
    console.error("Error al modificar usuario:", error);
    return res.status(500).json({
      ok: false,
      status: 500,
      message: error.message || "Error al modificar usuario",
      error: error.message || "Error inesperado",
    });
  }
});

//agregar o cambiar foto de perfil
router.post(
  "/image/single/:nameImage",
  authMiddleware,
  images.single("imagenPerfil"),
  async (req, res) => {
    const username = req.params.nameImage;

    const user = await User.findOne({ where: { nombre_usuario: username } });

    if (!user) {
      return res
        .status(404)
        .json({ ok: false, message: "Usuario no encontrado" });
    }

    try {
      // Actualiza el campo 'foto' del usuario con el nombre del archivo subido
      await user.update({ foto: req.file.filename });

      res.status(200).json({
        ok: true,
        message: "Imagen de perfil actualizada exitosamente",
      });
    } catch (error) {
      console.error("Error al actualizar imagen de perfil:", error);
      res
        .status(500)
        .json({ ok: false, message: "Error al actualizar imagen de perfil" });
    }
  }
);

// subir fotos al perfil del paseador
router.post(
  "/image/walker/single/:walkerId",
  authMiddleware,
  images.single("imagenPaseador"),
  async (req, res) => {
    const walkerId = req.params.walkerId;

    const walker = await Walker.findOne({
      where: { id: walkerId },
      include: User,
    });

    if (!walker) {
      return res
        .status(404)
        .json({ ok: false, message: "Paseador no encontrado" });
    }

    try {
      // Obtén la lista actual de fotos
      const currentFotos = walker.fotos || [];

      // Función para generar un nombre de archivo único
      const generateUniqueFilename = (filename, existingFilenames) => {
        let newFilename = filename;
        const [name, extension] = filename.split(".");

        if (extension !== "png" && extension !== "jpg") {
          //si la extension no es jpg ni png, le asigno png
          newFilename = `${name}.png`;
        } else {
          // si es jpg o png la dejo como esta
          newFilename = `${name}.${extension}`;
        }

        // si el nombre ya existe, lo modifico para que sea unico
        let counter = 1;
        while (existingFilenames.includes(newFilename)) {
          const [name, extension] = filename.split(".");
          newFilename = `${name}_${counter}.${extension}`;
          counter++;
        }
        return newFilename;
      };

      // Genera un nombre de archivo único si ya existe
      const newFoto = req.file.filename;
      const uniqueFoto = generateUniqueFilename(newFoto, currentFotos);

      // Agrega la nueva URL a la lista
      const updatedFotos = [...currentFotos, { url: uniqueFoto }];

      // Actualiza el campo 'fotos' del walker
      await walker.update({ fotos: updatedFotos });

      res.status(200).json({
        ok: true,
        message: "Foto subida con éxito",
        newImage: { url: uniqueFoto },
      });
    } catch (error) {
      console.error("Error al actualizar imagen de perfil:", error);
      res
        .status(500)
        .json({ ok: false, message: "Error al actualizar imagen de perfil" });
    }
  }
);

//solicitud de imagen
router.get("/image/single/:nameImage", authMiddleware, async (req, res) => {
  const username = req.params.nameImage;

  try {
    // Busca el usuario en la base de datos por su nombre de usuario
    const user = await User.findOne({ where: { nombre_usuario: username } });

    if (!user) {
      // Si no se encuentra el usuario devuelve un error 404
      return res.status(404).send("Usuario no encontrado");
    }

    if (!user.foto) {
      return res.sendFile(defaultImagePath);
    }

    // Construye la ruta completa de la imagen en el servidor
    const imagePath = path.join(ruta, user.foto);
    console.log(imagePath);

    // Envía la imagen como respuesta
    res.sendFile(imagePath);
  } catch (error) {
    console.error("Error al obtener la imagen del usuario:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.get("/image/walkers/:imageName", authMiddleware, async (req, res) => {
  const imageName = req.params.imageName;
  try {
    // Construye la ruta completa de la imagen en el servidor
    const imagePath = path.join(ruta, imageName);

    // Envía la imagen como respuesta
    res.sendFile(imagePath);
  } catch (error) {
    console.error("Error al obtener las imágenes de los paseadores:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.get("/image/walkers", authMiddleware, async (req, res) => {
  try {
    const walkers = await Walker.findAll({
      include: {
        model: User,
        attributes: ["nombre_usuario", "foto"],
      },
    });

    const walkerImages = walkers.map((walker) => ({
      nombre_usuario: walker.User.nombre_usuario,
      foto: walker.User.foto
        ? `http://localhost:3001/images/${walker.User.foto}`
        : null,
    }));

    res.status(200).json(walkerImages);
  } catch (error) {
    console.error("Error al obtener las imágenes de los paseadores:", error);
    res.status(500).send("Error interno del servidor");
  }
});

module.exports = router;
