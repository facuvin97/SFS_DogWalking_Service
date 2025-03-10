const User = require("../models/User");
const Walker = require("../models/Walker");
const sequelize = require("../config/db.js");
const Turn = require("../models/Turn.js");
const Bill = require("../models/Bill.js");
const Service = require("../models/Service.js");
const router = require("express").Router();
const { MercadoPagoConfig, OAuth } = require("mercadopago");
const globalConstants = require("../const/globalConstants");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const bcrypt = require("bcryptjs");

const authMiddleware = require("../middlewares/authMiddleware.js");

// devuelve todo los walkers, incluyendo info de usuario y turno
router.get("/walkers", authMiddleware, async (req, res) => {
  const walkers = await Walker.findAll({
    include: [
      {
        model: User,
      },
      {
        model: Turn,
        paranoid: false,
      },
    ],
  });

  // Aca podemos formatear el json antes de devolverlo

  res.status(200).json({
    ok: true,
    status: 200,
    body: walkers,
  });
});

// login walker para mobile
router.post("/login/walker", async (req, res) => {
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

    const walker = await Walker.findByPk(user.id);
    if (walker === null)
      return res
        .status(401)
        .json({ ok: false, message: "Usuario no es paseador" });

    // Omito la contraseña
    const { contraseña, ...userProps } = user.toJSON();
    // Combina las propiedades de user y walker en un solo objeto
    const loggedUser = {
      ...userProps,
      ...walker.toJSON(),
    };

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

router.get("/walkers/update/:walker_id", authMiddleware, async (req, res) => {
  try {
    const { walker_id } = req.params;
    // Busca el usuario por su nombre de usuario en la base de datos
    const user = await User.findByPk( walker_id);


    // Si no se encuentra el usuario o la contraseña no coincide, responde con un error de autenticación
    if (!user) {
      return res
        .status(401)
        .json({ ok: false, message: "Usuario no encontrado" });
    }

    const walker = await Walker.findByPk(user.id);
    
    if (walker === null)
      return res
        .status(401)
        .json({ ok: false, message: "Usuario no es paseador" });

    // Omito la contraseña
    const { contraseña, ...userProps } = user.toJSON();
    // Combina las propiedades de user y walker en un solo objeto
    const loggedUser = {
      ...userProps,
      ...walker.toJSON(),
    };

    // Si el usuario y la contraseña son correctos, devuelves el usuario encontrado
    res.status(200).json({
      ok: true,
      body:loggedUser,
    });
    console.log(loggedUser);
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    res.status(500).json({ ok: false, message: "Error al obtener el usuario" });
  }
});

router.get("/walkers/:walker_id", authMiddleware, async (req, res) => {
  const id = req.params.walker_id;
  const walker = await Walker.findOne({
    where: {
      id: id,
    },
    include: [
      {
        model: User,
        attributes: { exclude: ["contraseña"] },
      },
      {
        model: Turn,
        paranoid: false,
      },
    ],
  });
  res.status(200).json({
    ok: true,
    status: 200,
    body: walker,
  });
});

router.post("/walkers", (req, res, next) => {
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
      const walker = await Walker.create(
        {
          id: user.id, // Asigna el ID del usuario recién creado
          fotos: userData.fotos,
        },
        { transaction: t }
      );
      res.status(201).json({
        ok: true,
        status: 201,
        message: "Paseador creado exitosamente",
      });
    })
    .catch((error) => {
      // Si algo falla, revierte la transacción
      res.status(500).json({
        ok: false,
        status: 500,
        message: "Error al crear paseador",
        error: error,
      });
      console.error("Error al crear paseador:", error);
    });
});

router.put("/walkers/:walker_id", authMiddleware, (req, res) => {
  sequelize
    .transaction(async (t) => {
      const userData = req.body;
      const id = req.params.walker_id;

      // Modifico el usuario
      const user = await User.update(
        {
          foto: userData.foto,
          nombre_usuario: userData.nombre_usuario,
          contraseña: userData.contraseña,
          direccion: userData.direccion,
          email: userData.email,
          telefono: userData.telefono,
          calificacion: userData.calificacion,
        },
        {
          transaction: t,
          where: {
            id: id,
          },
        }
      );

      // modifica el paseador asociado al usuario
      const walker = await Walker.update(
        {
          fotos: userData.fotos,
        },
        {
          transaction: t,
          where: {
            id: id,
          },
        }
      );
      res.status(200).json({
        ok: true,
        status: 200,
        message: "Paseador modificado exitosamente",
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        status: 500,
        message: "Error al modificar paseador",
        error: error.errors[0].message,
      });
      console.error("Error al modificar paseador:", error);
    });
});

router.delete("/walkers/:walker_id", authMiddleware, (req, res) => {
  sequelize
    .transaction(async (t) => {
      const userData = req.body;
      const id = req.params.walker_id;

      const deleteWalker = await Walker.destroy({
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

      if (deleteWalker && deleteUser != 0) {
        res.status(200).json({
          ok: true,
          status: 200,
          message: "Paseador eliminado exitosamente",
        });
      } else {
        res.status(500).json({
          ok: false,
          status: 500,
          message: "No se encontro el paseador",
        });
      }
    })
    .catch((error) => {
      // Si algo falla, revierte la transacción
      res.status(500).send("Error al eliminar paseador");
      console.error("Error al eliminar paseador:", error);
    });
});

// asociar mercado pago
router.put(  "/walkers/mercadopago/:walker_id",  authMiddleware,
  async (req, res) => {
    try {
      const reqData = req.body;
      const id = req.params.walker_id;
      const walker = await Walker.findByPk(id);
      const tokenCode = reqData.code;

      // Obtener la fecha y hora actual
      const fechaHoraActual = new Date();

      // Restar 3 horas
      fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);

      // Formatear la fecha a 'yyyy-MM-dd HH:mm'
      const formattedFechaHoraActual = fechaHoraActual
        .toISOString()
        .slice(0, 10); // 'yyyy-MM-dd'

      const client = new MercadoPagoConfig({
        accessToken: globalConstants.ACCESS_TOKEN,
        options: { timeout: 5000 },
      });

      const oauth = new OAuth(client);

      oauth
        .create({
          body: {
            client_secret: globalConstants.CLIENT_SECRET,
            client_id: globalConstants.CLIENT_ID,
            code: tokenCode,
            redirect_uri: globalConstants.REDIRECT_URI,
          },
        })
        .then(async (result) => {
          // modifica el paseador
          await walker.update({
            mercadopago: true,
            fecha_mercadopago: formattedFechaHoraActual,
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            public_key: result.public_key,
          });

          res.status(200).json({
            ok: true,
            status: 200,
            token: result.access_token,
          });
        })
        .catch((error) => console.log(error));
    } catch (error) {
      res.status(500).send("Error al asociar mercadopago");
      console.error("Error al asociar mercadopago:", error);
    }
  }
);

// modificar metodos de cobro
router.put("/walkers/cobro/:walker_id", authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const reqData = req.body;
    const id = req.params.walker_id;

    const walker = await Walker.findByPk(id);

    // modifica el paseador
    await walker.update(
      {
        mercadopago: reqData.mercadopago,
        efectivo: reqData.efectivo,
      },
      { transaction: t }
    );

    //si no tiene mercadopago ni efectivo, mando error
    if (!walker.mercadopago && !walker.efectivo) {
      await t.rollback();
      return res
        .status(500)
        .send("Debe tener al menos un metodo de cobro disponible");
    }

    await t.commit();

    return res.status(200).json({
      ok: true,
      status: 200,
      message: "Metodo de cobro actualizado",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al modificar metodo de cobro:", error);
    return res.status(500).send("Error al modificar metodo de cobro");
  }
});

// obtener walker por el id de la factura
router.get("/walkers/byBill/:billId", authMiddleware, async (req, res) => {
  const id = req.params.billId;
  // Obtener la factura por su ID
  const bill = await Bill.findByPk(id, {
    include: {
      model: Service, // Incluir el modelo Service
      include: {
        model: Turn, // Incluir el modelo Turn dentro de Service
        paranoid: false,
        include: {
          model: Walker, // Incluir el modelo Walker dentro de Turn
          attributes: ["mercadopago", "efectivo"],
        },
      },
    },
  });

  //verificacion
  if (bill === null) {
    res.status(400).json({
      ok: false,
      status: 400,
      message: "No existe la factura con el id indicado",
    });
  }

  const walker = bill.Service.Turn.Walker;
  res.status(200).json({
    ok: true,
    status: 200,
    message: "ok",
    body: walker,
  });
});

router.delete("/image/:walkerId", authMiddleware, (req, res) => {
  sequelize
    .transaction(async (t) => {
      const { walkerId } = req.params;
      const { imageUrl } = req.body;

      // Busca el paseador
      const walker = await Walker.findByPk(walkerId, { transaction: t });
      if (!walker) {
        return res.status(404).json({
          ok: false,
          message: "No existe el paseador con ese ID",
        });
      }

      // Busca en walker.fotos si existe la imagen
      const image = walker.fotos.find((foto) => foto.url === imageUrl);
      if (!image) {
        return res.status(404).json({
          ok: false,
          message: "No existe la imagen con ese URL",
        });
      }

      // Elimina la imagen de walker.fotos
      walker.fotos = walker.fotos.filter((foto) => foto.url !== imageUrl);

      // Guarda el walker en la base de datos
      await walker.save({ transaction: t });

      // Elimina la imagen del sistema de archivos
      const imagePath = path.join(__dirname, "../../images/", image.url);
      fs.unlinkSync(imagePath);

      // Responde con éxito
      res.status(200).json({
        ok: true,
        message: "Imagen eliminada correctamente",
      });
    })
    .catch((error) => {
      // Si algo falla, revierte la transacción y responde con un error
      console.error("Error al eliminar la imagen:", error);
      res.status(500).json({
        ok: false,
        message: "Error al eliminar la imagen",
        error: error.message,
      });
    });
});

module.exports = router;
