const User = require("../models/User")
const Walker = require("../models/Walker")
const sequelize = require('../config/db.js');
const Turn = require("../models/Turn.js");
const Bill = require("../models/Bill.js");
const Service = require("../models/Service.js");
const router = require("express").Router()
const { MercadoPagoConfig, OAuth } = require('mercadopago');
const globalConstants = require("../const/globalConstants")

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

router.post("/walkers", (req, res, next) => {
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
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al crear paseador",
      error: error.errors[0].message
    })
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
       res.status(500).json({
        ok: false,
        status: 500,
        message: "Error al modificar paseador",
        error: error.errors[0].message
      })
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

    // Obtener la fecha y hora actual
    const fechaHoraActual = new Date();

    // Restar 3 horas
    fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);

    // Formatear la fecha a 'yyyy-MM-dd HH:mm'
    const formattedFechaHoraActual = fechaHoraActual.toISOString()
      .slice(0, 10) // 'yyyy-MM-dd'
    
  
    const client = new MercadoPagoConfig({ accessToken: globalConstants.ACCESS_TOKEN, options: { timeout: 5000 } }); 

    const oauth = new OAuth(client);

    oauth.create({ body:{
      'client_secret':globalConstants.CLIENT_SECRET,
      'client_id': globalConstants.CLIENT_ID,
      'code':tokenCode,
      'redirect_uri':globalConstants.REDIRECT_URI
    }
    }).then(async (result) => {
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


  // obtener walker por el id de la factura
  router.get("/walkers/byBill/:billId", async (req, res) => {    
    const id = req.params.billId;
    // Obtener la factura por su ID
    const bill = await Bill.findByPk(id, {
      include: {
        model: Service, // Incluir el modelo Service
        include: {
          model: Turn, // Incluir el modelo Turn dentro de Service
          include: {
            model: Walker // Incluir el modelo Walker dentro de Turn
          }
        }
      }
    })

    //verificacion
    if (bill === null) {
      res.status(400).json({
        ok: false,
        status: 400,
        message: 'No existe la factura con el id indicado'
      })
    }

    const walker = bill.Service.Turn.Walker

    res.status(200).json({
      ok: true,
      status: 200,
      message: "ok",
      body: bill.Service.Turn.Walker.mercadopago
    })
  })

module.exports = router