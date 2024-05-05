const Client = require("../models/Client")
const User = require("../models/User")
const sequelize = require('../config/db.js');
const multer = require('multer')
const fs = require('fs'); 
const path = require('path')
const { where } = require("sequelize");


const images = multer({
  dest: 'images/',
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'images/');
    },
    filename: function (req, file, cb) {
      const username = req.params.nameImage;
      const fileName = `${username}.png`;
      cb(null, fileName);
    }
  })
})

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

/* router.post('/image/single/:nameImage', images.single('imagenPerfil'), async (req, res) =>{
  console.log(req.file)  
  const username = req.params.nameImage; // Accede al parámetro directamente sin usar destructuración
  const imagePath = req.file.path; // Ruta temporal de la imagen subida
  const user = await User.findOne({ where: { nombre_usuario: username } })
  
  //const imagePath = saveImage(req.file, username);
  //res.send('Termina')

  if (!user) {
    // Maneja el caso donde el usuario no se encuentra
    return res.status(404).json({ ok: false, message: "Usuario no encontrado" })
  }

  try {
    // Actualiza el campo 'foto' del usuario con la ruta de la imagen
    await user.update({ foto: imagePath })
    res.status(200).json({ ok: true, message: "Imagen de perfil actualizada exitosamente" })
  } catch (error) {
    console.error("Error al actualizar imagen de perfil:", error)
    res.status(500).json({ ok: false, message: "Error al actualizar imagen de perfil" })
  }
}) */
router.post('/image/single/:nameImage', images.single('imagenPerfil'), async (req, res) => {
  const username = req.params.nameImage;

  const user = await User.findOne({ where: { nombre_usuario: username } });

  if (!user) {
    return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
  }

  try {
    // Elimina la imagen anterior si existe
    if (user.foto) {
      const previousImagePath = path.join(__dirname, '..', 'images', user.foto);
      if (fs.existsSync(previousImagePath)) {
        fs.unlinkSync(previousImagePath);
      }
    }

    // Actualiza el campo 'foto' del usuario con el nombre del archivo subido
    await user.update({ foto: req.file.filename });

    res.status(200).json({ ok: true, message: "Imagen de perfil actualizada exitosamente" });
  } catch (error) {
    console.error("Error al actualizar imagen de perfil:", error);
    res.status(500).json({ ok: false, message: "Error al actualizar imagen de perfil" });
  }
})

//solicitud de imagen
router.get('/image/single/:nameImage', async (req, res) => {
  const username = req.params.nameImage;

  try {
    // Busca el usuario en la base de datos por su nombre de usuario
    const user = await User.findOne({ where: { nombre_usuario: username } });

    if (!user || !user.foto) {
      // Si no se encuentra el usuario o no tiene una ruta de imagen, devuelve un error 404
      return res.status(404).send('Imagen no encontrada');
    }

    // Construye la ruta completa de la imagen en el servidor
    const imagePath = path.join(__dirname, '..','..', 'images', user.foto);
    console.log(imagePath)

    // Envía la imagen como respuesta
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error al obtener la imagen del usuario:', error);
    res.status(500).send('Error interno del servidor');
  }
})
//funcion para guardar y renombrar la immagen en un directorio local
/* function saveImage(file, username) {
  const newPath = `./images/${username}.png`;
  fs.renameSync(file.path, newPath);
  console.log(newPath)
  console.log(file.path)
  return newPath;
} */

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