const User = require("../models/User")
const Walker = require("../models/Walker")
const sequelize = require('../config/db.js');
const Turn = require("../models/Turn.js");
const router = require("express").Router()
const { MercadoPagoConfig, OAuth } = require('mercadopago');

// devuelve todo los walkers, incluyendo info de usuario y turno
router.get("/walkers", async (req, res) => {
  const walkers = await Walker.findAll({
    include: [
      {
        model: User,
      },
      {
        model: Turn,
      }
    ]
  })

  // Aca podemos formatear el json antes de devolverlo

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

    if (deleteWalker && deleteUser != 0)
    {
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
    
  }).catch((error) => {
    // Si algo falla, revierte la transacción
    res.status(500).send('Error al eliminar paseador');
    console.error('Error al eliminar paseador:', error);
  });
})


// asociar mercado pago
router.put("/walkers/mercadopago/:walker_id", async (req, res) => {
  try {
    const reqData = req.body
    const id = req.params.walker_id
    const walker = await Walker.findByPk(id)
    const tokenCode = reqData.code
    
    
    const client = new MercadoPagoConfig({ accessToken: 'APP_USR-2635371829801721-081210-7db5843b60d97900a8b3bdbbf169a67d-1940982627', options: { timeout: 5000 } }); 

    const oauth = new OAuth(client);

    console.log('token code:', tokenCode)

    oauth.create({ body:{
      'client_secret':'Set797wVnLbC6T44H0wO39Rd4iYHTuUg',
      'client_id':'2635371829801721',
      'code':tokenCode,
      'redirect_uri':'https://strong-llamas-own.loca.lt/success-association'
    }
    }).then(async (result) => {
      // modifica el paseador
      await walker.update({
        mercadopago: true,
        fecha_mercadopago: new Date(),
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        public_key: result.public_key,
      });

      res.status(200).json({
        ok: true,
        status: 200,
        token: result.access_token,
      });
    }).catch((error) => console.log(error));


  } catch(error) {
    res.status(500).send('Error al asociar mercadopago');
    console.error('Error al asociar mercadopago:', error);
  };
})

  // modificar metodos de cobro
  router.put("/walkers/cobro/:walker_id", async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const reqData = req.body
      const id = req.params.walker_id
      
      const walker = await Walker.findByPk(id)

      
      // modifica el paseador
      await walker.update({
        mercadopago: reqData.mercadopago,
        efectivo: reqData.efectivo
      }, {transaction: t});


      //si no tiene mercadopago ni efectivo, mando error
      if (!walker.mercadopago && !walker.efectivo) {
        await t.rollback()
        return res.status(500).send('Debe tener al menos un metodo de cobro disponible')
      }

      await t.commit()

      return res.status(200).json({
        ok: true,
        status: 200,
        message: "Metodo de cobro actualizado",
      });
    } catch(error) {
      await t.rollback()
      console.error('Error al modificar metodo de cobro:', error);
      return res.status(500).send('Error al modificar metodo de cobro');
    };
  })

module.exports = router