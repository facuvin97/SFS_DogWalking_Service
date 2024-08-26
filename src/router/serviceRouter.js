const { Router } = require('express');
const Service = require('../models/Service.js');
const Turn = require('../models/Turn.js');
const Walker = require('../models/Walker.js');
const { Op } = require('sequelize');
const User = require('../models/User.js');
const Client = require('../models/Client.js');
const Notification = require('../models/Notification.js');
const sequelize = require('../config/db.js');
const Bill = require('../models/Bill.js');
const router = Router();
const moment = require('moment-timezone');
const { format } = require('date-fns');



// Obtener todos los servicios de un cliente
router.get('/services/client/:client_id', async (req, res) => {
  const clientId = req.params.client_id;
  try {
    const services = await Service.findAll({
      where: {
        ClientId: clientId
      }, 
      include: Turn
    });
    res.status(200).json({
      ok: true,
      status: 200,
      body: services
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: 'Error al obtener los servicios',
      error: error.message
    });
    console.error('Error al obtener los servicios:', error);
  }
});

//obtener todos los servicios de un turno
router.get('/services/turn/:turn_id', async (req, res) => {
  const turnId = req.params.turn_id;
  try {
    const services = await Service.findAll({
      where: {
        TurnId: turnId
      }
    });
    res.status(200).json({
      ok: true,
      status: 200,
      body: services
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: 'Error al obtener los servicios',
      error: error.message
    });
    console.error('Error al obtener los servicios:', error);
  }
});

//obtener todos los servicios de un paseador, con su turno y paseador
router.get('/services/walker/:walker_id', async (req, res) => {
  const walkerId = req.params.walker_id;
  try {
    const turns = await Turn.findAll({
      where: {
        WalkerId: walkerId
      },
    })


    // Extraer los IDs de los turnos
    const turnIds = turns.map(turno => turno.id);


    const services = await Service.findAll({
      where: {
        TurnId: {
          [Op.in]: turnIds
        }
      },
      include: {
        model: Turn,
        include: {
          model: Walker,
          include: User
        }
      }
    });

    res.status(200).json({
      ok: true,
      status: 200,
      body: services
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: 'Error al obtener los servicios',
      error: error.message
    });
    console.error('Error al obtener los servicios:', error);
  }
});

// Obtener un servicio por su id
router.get('/services/:service_id', async (req, res) => {
  const id = req.params.service_id;
  try {
    const service = await Service.findOne({
      where: {
        id: id
      }
    });
    if (service) {
      res.status(200).json({
        ok: true,
        status: 200,
        body: service
      });
    } else {
      res.status(404).json({
        ok: false,
        status: 404,
        message: 'Servicio no encontrado'
      });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: 'Error al obtener el servicio',
      error: error.message
    });
    console.error('Error al obtener el servicio:', error);
  }
});

// Agregar un servicio
router.post('/services', async (req, res) => {
  sequelize.transaction(async (t) => {
    const serviceData = req.body;

    // Obtener la fecha y hora actual
    const fechaHoraActual = new Date();

    // Restar 3 horas
    fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);

    // Formatear la fecha a 'yyyy-MM-dd HH:mm'
    const formattedFechaHoraActual = fechaHoraActual.toISOString()
      .slice(0, 16) // 'yyyy-MM-ddTHH:mm'
      .replace('T', ' '); // Cambia 'T' por un espacio

    // Crea el servicio
    const service = await Service.create({
      fecha: serviceData.fecha,
      direccionPickUp: serviceData.direccionPickUp,
      cantidad_mascotas: serviceData.cantidad_mascotas,
      nota: serviceData.nota,
      TurnId: serviceData.TurnId, // Asigna el ID del Turno al servicio
      ClientId: serviceData.ClientId // Asigna el ID del Cliente al servicio
    }, {transaction: t});
    //traigo los datos del cliente, para mostrar en la notificacion
    const client = await User.findByPk(serviceData.ClientId, {transaction: t})
    // console.log("\n\n\n\n\n\n\n\n\nfecha servicio: " , service.fecha)


    //traigo el turno para tener el id del walker
    const turn = await Turn.findByPk(serviceData.TurnId, {transaction: t})

    // envio una notificacion al paseador
    await Notification.create({
      titulo: 'Nueva solicitud de servicio',
      contenido: `El cliente ${client.nombre_usuario} ha solicitado un servicio para el dia ${serviceData.fecha}`,
      fechaHora: formattedFechaHoraActual,
      userId: turn.WalkerId
    }, { transaction: t });

    res.status(201).json({
      ok: true,
      status: 201,
      message: 'Servicio creado exitosamente',
      data: service
    });
  }).catch ((error) => {
    res.status(500).json({
      ok: false,
      status: 500,
      message: 'Error al crear servicio',
      error: error.message
    });
    console.error('Error al crear servicio:', error);
  })

  // console.log('\n\n\nfecha despues de transeccion', res)
});

// Modificar un servicio (solo se usa para cambiar el valor de aceptado, cuando el paseador acepta la solicitud)
router.put('/services/:service_id', async (req, res) => {
  sequelize.transaction(async (t) => {
    const id = req.params.service_id;
    const serviceData = req.body;

    // Verificar si el servicio existe
    const existingService = await Service.findOne({ where: { id: id }, transaction: t });

    if (!existingService) {
      return res.status(404).json({
        ok: false,
        status: 404,
        message: 'Servicio no encontrado'
      });
    }

    // Actualiza el servicio
    await Service.update(
      {
        fecha: serviceData.fecha,
        direccionPickUp: serviceData.direccionPickUp,
        cantidad_mascotas: serviceData.cantidad_mascotas,
        nota: serviceData.nota,
        aceptado: serviceData.aceptado,
        TurnId: serviceData.TurnId, // Asigna el ID del Turno al servicio
        ClientId: serviceData.ClientId // Asigna el ID del Cliente al servicio
      },
      {
        where: { id: id }, transaction: t
      },
    );

    //traigo el turno para tener el id del walker
    const turn = await Turn.findByPk(existingService.TurnId, {transaction: t})
    const today = moment().tz('America/Montevideo') // Reemplaza 'America/Bogota' con la zona horaria de tu país
    //const fechaHora = now.format('YYYY-MM-DD HH:mm:ss');
    //const fecha = new Date().toISOString();
    //const today = fecha;
    //console.log("\n\n\nfecha: " ,fechaHora)

    //TODO:
    
    console.log("\n\n\nfectura today: " ,today)
    const bill = await Bill.create({ 
      fecha: today,     
      monto: existingService.cantidad_mascotas * turn.tarifa,
      ServiceId: existingService.id,     
    }, {transaction: t});
    console.log("\n\n\nfectura today despues de creada: " ,bill.fecha)

    // Obtener la fecha y hora actual
    const fechaHoraActual = new Date();

    // Restar 3 horas
    fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);

    // Formatear la fecha a 'yyyy-MM-dd HH:mm'
    const formattedFechaHoraActual = fechaHoraActual.toISOString()
      .slice(0, 16) // 'yyyy-MM-ddTHH:mm'
      .replace('T', ' '); // Cambia 'T' por un espacio

    // envio una notificacion al cliente
    await Notification.create({
      titulo: 'Solicitud de servicio aceptada',
      contenido: `Su servicio para el dia ${serviceData.fecha} ha sido confirmado`,
      userId: serviceData.ClientId,
      fechaHora: formattedFechaHoraActual
    }, { transaction: t });

    res.status(200).json({
      ok: true,
      status: 200,
      message: 'Servicio modificado exitosamente'
    });
  }).catch ((error) => {
    res.status(500).json({
      ok: false,
      status: 500,
      message: 'Error al modificar servicio',
      error: error.message
    });
    console.error('Error al modificar servicio:', error);
  })
  console.log("\n\n\nfectura today despues de transaccion: " ,res)

});

// Eliminar un servicio
router.delete('/services/:service_id', async (req, res) => {
  sequelize.transaction(async (t) => {
    const id = req.params.service_id;

    // Aca tenemos que diferenciar que tipo de usuario esta eliminando el servicio, para ver a quien le mandamos la notificacion
    const userType = req.body.execUserType;

    const userId = req.body.userId;
    const fecha = req.body.fecha;
    const fechaFormateada = format(fecha, 'dd/MM/yyyy');

    const nombreCliente = req.body.nombreCliente ?? null;



    // Elimina el servicio
    const deleteService = await Service.destroy({
      where: { id: id },
      transaction: t
    });

    if (deleteService) {
      res.status(200).json({
        ok: true,
        status: 200,
        message: 'Servicio eliminado exitosamente'
      });
    } else {
      res.status(404).json({
        ok: false,
        status: 404,
        message: 'Servicio no encontrado'
      });
    }

    // Obtener la fecha y hora actual
    const fechaHoraActual = new Date();

    // Restar 3 horas
    fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);

    // Formatear la fecha a 'yyyy-MM-dd HH:mm'
    const formattedFechaHoraActual = fechaHoraActual.toISOString()
      .slice(0, 16) // 'yyyy-MM-ddTHH:mm'
      .replace('T', ' '); // Cambia 'T' por un espacio

    if (userType === 'walker') {
      await Notification.create({
        titulo: 'Servicio cancelado',
        contenido: `El servicio para la fecha ${fechaFormateada} ha sido cancelado`,
        userId: userId,
        fechaHora: formattedFechaHoraActual
      }, { transaction: t });
    } else if (userType === 'client') {
      await Notification.create({
        titulo: 'Servicio cancelado',
        contenido: `El usuario ${nombreCliente} ha cancelado el servicio para la fecha ${fechaFormateada}`,
        userId: userId,
        fechaHora: formattedFechaHoraActual
      }, { transaction: t });
    } else { //si no viene lo que espero en walker, hago rollback
      await t.rollback();
      res.status(500).json({
        ok: false,
        status: 500,
        message: 'Tipo de usuario no valido',
      });
      
    }



  }).catch ((error) => {
    res.status(500).json({
      ok: false,
      status: 500,
      message: 'Error al eliminar servicio',
      error: error.message
    });
    console.error('Error al eliminar servicio:', error);
  })
});

module.exports = router;
