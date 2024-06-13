const { Router } = require('express');
const Service = require('../models/Service.js');
const Turn = require('../models/Turn.js');
const Walker = require('../models/Walker.js');
const { Op } = require('sequelize');
const User = require('../models/User.js');
const Client = require('../models/Client.js');
const Notification = require('../models/Notification.js');
const sequelize = require('../config/db.js');
const router = Router();

// Obtener todos los servicios de un cliente
router.get('/services/client/:client_id', async (req, res) => {
  const clientId = req.params.client_id;
  try {
    const services = await Service.findAll({
      where: {
        ClientId: clientId
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
router.get('/service/:service_id', async (req, res) => {
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
router.post('/service', async (req, res) => {
  sequelize.transaction(async (t) => {
    const serviceData = req.body;

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

    //traigo el turno para tener el id del walker
    const turn = await Turn.findByPk(serviceData.TurnId, {transaction: t})

    // envio una notificacion al paseador
    await Notification.create({
      titulo: 'Nueva solicitud de servicio',
      contenido: `El cliente ${client.nombre_usuario} ha solicitado un servicio para el dia ${serviceData.fecha}`,
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
});

// Modificar un servicio (solo se usa para cambiar el valor de aceptado, cuando el paseador acepta la solicitud)
router.put('/service/:service_id', async (req, res) => {
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

    // envio una notificacion al cliente
    await Notification.create({
      titulo: 'Solicitud de servicio aceptada',
      contenido: `Su servicio para el dia ${serviceData.fecha} ha sido confirmado`,
      userId: serviceData.ClientId
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
});

// Eliminar un servicio
router.delete('/service/:service_id', async (req, res) => {
  try {
    const id = req.params.service_id;

    // Aca tenemos que diferenciar que tipo de usuario esta eliminando el servicio, para ver a quien le mandamos la notificacion
    const userType = req.params.execUserType;

    // Elimina el servicio
    const deleteService = await Service.destroy({
      where: { id: id }
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
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: 'Error al eliminar servicio',
      error: error.message
    });
    console.error('Error al eliminar servicio:', error);
  }
});

module.exports = router;
