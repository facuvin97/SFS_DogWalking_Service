const { Router } = require("express");
const Service = require("../models/Service.js");
const Turn = require("../models/Turn.js");
const Walker = require("../models/Walker.js");
const { Op } = require("sequelize");
const User = require("../models/User.js");
const Client = require("../models/Client.js");
const Notification = require("../models/Notification.js");
const sequelize = require("../config/db.js");
const Bill = require("../models/Bill.js");
const router = Router();
const moment = require("moment-timezone");
const { format } = require("date-fns");
const Message = require("../models/Message.js");
const { getIO, getSocketByUserId } = require("../config/socket.js");

// Obtener todos los servicios de un cliente
router.get("/services/client/:client_id", async (req, res) => {
  const clientId = req.params.client_id;
  try {
    const services = await Service.findAll({
      where: {
        ClientId: clientId,
      },
      include: {
        model: Turn,
        paranoid: false,
      },
    });
    res.status(200).json({
      ok: true,
      status: 200,
      body: services,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al obtener los servicios",
      error: error.message,
    });
    console.error("Error al obtener los servicios:", error);
  }
});

//obtener todos los servicios de un turno
router.get("/services/turn/:turn_id", async (req, res) => {
  const turnId = req.params.turn_id;
  try {
    const services = await Service.findAll({
      where: {
        TurnId: turnId,
      },
    });
    res.status(200).json({
      ok: true,
      status: 200,
      body: services,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al obtener los servicios",
      error: error.message,
    });
    console.error("Error al obtener los servicios:", error);
  }
});

//obtener todos los servicios de un turno para el dia actual
router.get("/services/turn/today/:turn_id/:date", async (req, res) => {
  const turnId = req.params.turn_id;
  const date = req.params.date;

  // Obtener la fecha y hora actual
  const fechaHoraActual = new Date();

  // Restar 3 horas
  fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);

  // Formatear la fecha a 'yyyy-MM-dd HH:mm'
  const formattedFechaActual = fechaHoraActual.toISOString().slice(0, 10); // 'yyyy-MM-dd'

  try {
    const services = await Service.findAll({
      where: {
        TurnId: turnId,
        fecha: date,
        aceptado: true,
      },
    });
    res.status(200).json({
      ok: true,
      status: 200,
      body: services,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al obtener los servicios",
      error: error.message,
    });
    console.error("Error al obtener los servicios:", error);
  }
});

//obtener todos los servicios de un paseador, con su turno y paseador
router.get("/services/walker/:walker_id", async (req, res) => {
  const walkerId = req.params.walker_id;
  try {
    const turns = await Turn.findAll({
      where: {
        WalkerId: walkerId,
      },
    });

    // Extraer los IDs de los turnos
    const turnIds = turns.map((turno) => turno.id);

    const services = await Service.findAll({
      where: {
        TurnId: {
          [Op.in]: turnIds,
        },
      },
      include: [
        {
          model: Turn,
          paranoid: false,
          include: {
            model: Walker,
            include: User,
          },
        },
        {
          model: Client,
          include: {
            model: User,
            attributes: ["nombre_usuario", "calificacion"],
          },
        },
      ],
    });

    res.status(200).json({
      ok: true,
      status: 200,
      body: services,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al obtener los servicios",
      error: error.message,
    });
    console.error("Error al obtener los servicios:", error);
  }
});

// Obtener los servicios futuros de un paseador, con su turno
router.get("/services/walker/future/:walker_id", async (req, res) => {
  const walkerId = req.params.walker_id;

  // Obtener la fecha y hora actual
  const fechaHoraActual = new Date();

  // Restar 3 horas
  fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);

  // Formatear la fecha a 'yyyy-MM-dd HH:mm'
  const formattedFechaActual = fechaHoraActual.toISOString().slice(0, 10); // 'yyyy-MM-dd'

  try {
    const turns = await Turn.findAll({
      where: {
        WalkerId: walkerId,
      },
    });

    // Extraer los IDs de los turnos
    const turnIds = turns.map((turno) => turno.id);

    const services = await Service.findAll({
      where: {
        finalizado: false,
        TurnId: {
          [Op.in]: turnIds,
        },
        fecha: {
          [Op.gte]: formattedFechaActual, // Condición para traer servicios desde hoy en adelante
        },
      },
      include: [
        {
          model: Turn,
          paranoid: false,
        },
        {
          model: Client,
          include: {
            model: User,
            attributes: ["nombre_usuario", "calificacion"],
          },
        },
      ],
    });

    res.status(200).json({
      ok: true,
      status: 200,
      body: services,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al obtener los servicios",
      error: error.message,
    });
    console.error("Error al obtener los servicios:", error);
  }
});

// Obtener los servicios finalizados de un paseador, con su turno
router.get("/services/walker/finished/:walker_id", async (req, res) => {
  const walkerId = req.params.walker_id;
  try {
    const turns = await Turn.findAll({
      where: {
        WalkerId: walkerId,
      },
    });

    // Extraer los IDs de los turnos
    const turnIds = turns.map((turno) => turno.id);

    const services = await Service.findAll({
      where: {
        finalizado: true,
        TurnId: {
          [Op.in]: turnIds,
        },
      },
      include: [
        {
          model: Turn,
          paranoid: false,
        },
        {
          model: Client,
          include: {
            model: User,
            attributes: ["nombre_usuario", "calificacion"],
          },
        },
      ],
    });

    res.status(200).json({
      ok: true,
      status: 200,
      body: services,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al obtener los servicios",
      error: error.message,
    });
    console.error("Error al obtener los servicios:", error);
  }
});

// Obtener un servicio por su id
router.get("/services/:service_id", async (req, res) => {
  const id = req.params.service_id;
  try {
    const service = await Service.findOne({
      where: {
        id: id,
      },
      include: {
        model: Turn,
        paranoid: false,
        attributes: ["WalkerId"],
      },
    });

    if (service) {
      res.status(200).json({
        ok: true,
        status: 200,
        body: service,
      });
    } else {
      res.status(404).json({
        ok: false,
        status: 404,
        message: "Servicio no encontrado",
      });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: "Error al obtener el servicio",
      error: error.message,
    });
    console.error("Error al obtener el servicio:", error);
  }
});

// Agregar un servicio
router.post("/services", async (req, res) => {
  sequelize
    .transaction(async (t) => {
      const serviceData = req.body;

      // Obtener la fecha y hora actual
      const fechaHoraActual = new Date();

      // Restar 3 horas
      fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);

      // Formatear la fecha a 'yyyy-MM-dd HH:mm'
      const formattedFechaHoraActual = fechaHoraActual
        .toISOString()
        .slice(0, 16) // 'yyyy-MM-ddTHH:mm'
        .replace("T", " "); // Cambia 'T' por un espacio

      // Formatear la fecha a 'yyyy-MM-dd HH:mm'
      const formattedFechaActual = fechaHoraActual.toISOString().slice(0, 10); // 'yyyy-MM-dd'

      // Crea el servicio
      const service = await Service.create(
        {
          fecha: serviceData.fecha,
          direccionPickUp: serviceData.direccionPickUp,
          cantidad_mascotas: serviceData.cantidad_mascotas,
          nota: serviceData.nota,
          TurnId: serviceData.TurnId, // Asigna el ID del Turno al servicio
          ClientId: serviceData.ClientId, // Asigna el ID del Cliente al servicio
        },
        { transaction: t }
      );
      //traigo los datos del cliente, para mostrar en la notificacion
      const client = await User.findByPk(serviceData.ClientId, {
        transaction: t,
      });

      //traigo el turno para tener el id del walker
      const turn = await Turn.findByPk(serviceData.TurnId, { transaction: t });

      // envio una notificacion al paseador
      const notification = await Notification.create(
        {
          titulo: "Nueva solicitud de servicio",
          contenido: `El cliente ${client.nombre_usuario} ha solicitado un servicio para el dia ${serviceData.fecha}`,
          fechaHora: formattedFechaHoraActual,
          userId: turn.WalkerId,
        },
        { transaction: t }
      );

      const newMessage = await Message.create({
        senderId: serviceData.ClientId,
        receiverId: turn.WalkerId,
        contenido:
          "Te he solicitado un servicio para el día " + serviceData.fecha + ".",
        fechaHora: formattedFechaHoraActual,
        sent: true,
        read: false,
      });

      const io = getIO(); // Obtén la instancia de io

      // Función auxiliar para obtener el socket de un usuario por userId
      function getSocketByUserId(userId) {
        const socketEntry = Array.from(io.sockets.sockets).find(
          ([, socket]) =>
            socket.handshake.auth.userId.toString() === userId.toString()
        );

        return socketEntry ? socketEntry[1] : null; // Devolver solo el socket
      }

      // Emitir el mensaje y la notificacion mediante socket.io al paseador
      const targetSocket = getSocketByUserId(turn.WalkerId);
      if (targetSocket) {
        targetSocket.emit("receiveMessage", {
          id: newMessage.id,
          senderId: newMessage.senderId,
          receiverId: newMessage.receiverId,
          contenido: newMessage.contenido,
          sent: newMessage.sent,
          read: newMessage.read,
        });
        targetSocket.emit("notification", notification.toJSON());
        targetSocket.emit("shServices");
      }

      const serviceDataResponse = service.toJSON();
      serviceDataResponse.Turn = turn;

      res.status(201).json({
        ok: true,
        status: 201,
        message: "Servicio creado exitosamente",
        data: serviceDataResponse,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        status: 500,
        message: "Error al crear servicio",
        error: error.message,
      });
      console.error("Error al crear servicio:", error);
    });
});

// Modificar un servicio (solo se usa para cambiar el valor de aceptado, cuando el paseador acepta la solicitud)
router.put("/services/:service_id", async (req, res) => {
  sequelize
    .transaction(async (t) => {
      const id = req.params.service_id;

      // Obtener la fecha y hora actual
      const fechaHoraActual = new Date();

      // Restar 3 horas
      fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);

      // Formatear la fecha a 'yyyy-MM-dd HH:mm'
      const formattedFechaHoraActual = fechaHoraActual
        .toISOString()
        .slice(0, 16) // 'yyyy-MM-ddTHH:mm'
        .replace("T", " "); // Cambia 'T' por un espacio

      // Formatear la fecha a 'yyyy-MM-dd HH:mm'
      const formattedFechaActual = fechaHoraActual.toISOString().slice(0, 10); // 'yyyy-MM-dd'

      // Verificar si el servicio existe
      const existingService = await Service.findOne({
        where: { id: id },
        transaction: t,
      });

      if (!existingService) {
        return res.status(404).json({
          ok: false,
          status: 404,
          message: "Servicio no encontrado",
        });
      }

      // Actualiza el servicio
      await Service.update(
        {
          aceptado: true,
        },
        {
          where: { id: id },
          transaction: t,
        }
      );

      //traigo el turno para tener el id del walker
      const turn = await Turn.findByPk(existingService.TurnId, {
        transaction: t,
      });
      const today = moment().tz("America/Montevideo");

      const bill = await Bill.create(
        {
          fecha: formattedFechaActual,
          monto: existingService.cantidad_mascotas * turn.tarifa,
          ServiceId: existingService.id,
        },
        { transaction: t }
      );

      // envio una notificacion al cliente
      const notification = await Notification.create(
        {
          titulo: "Solicitud de servicio aceptada",
          contenido: `Su servicio para el dia ${existingService.fecha} ha sido confirmado`,
          userId: existingService.ClientId,
          fechaHora: formattedFechaHoraActual,
        },
        { transaction: t }
      );

      const newMessage = await Message.create(
        {
          senderId: turn.WalkerId,
          receiverId: existingService.ClientId,
          contenido:
            "He aceptado tu solicitud de servicio para el dia " +
            existingService.fecha +
            ".",
          fechaHora: formattedFechaHoraActual,
          sent: true,
          read: false,
        },
        { transaction: t }
      );

      const io = getIO(); // Obtén la instancia de io

      // Función auxiliar para obtener el socket de un usuario por userId
      function getSocketByUserId(userId) {
        const socketEntry = Array.from(io.sockets.sockets).find(
          ([, socket]) =>
            socket.handshake.auth.userId.toString() === userId.toString()
        );

        return socketEntry ? socketEntry[1] : null; // Devolver solo el socket
      }

      // Emitir el mensaje mediante socket.io al cliente
      const targetSocket = getSocketByUserId(existingService.ClientId);
      if (targetSocket) {
        targetSocket.emit("receiveMessage", {
          id: newMessage.id,
          senderId: newMessage.senderId,
          receiverId: newMessage.receiverId,
          contenido: newMessage.contenido,
          sent: newMessage.sent,
          read: newMessage.read,
        });
        targetSocket.emit("notification", notification.toJSON());
        targetSocket.emit("refreshServices");
        targetSocket.emit("refreshBills")
      }

      res.status(200).json({
        ok: true,
        status: 200,
        message: "Servicio modificado exitosamente",
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        status: 500,
        message: "Error al modificar servicio",
        error: error.message,
      });
      console.error("Error al modificar servicio:", error);
    });
});

// Eliminar un servicio
router.delete("/services/:service_id", async (req, res) => {
  sequelize
    .transaction(async (t) => {
      const id = req.params.service_id;

      // Obtener la fecha y hora actual
      const fechaHoraActual = new Date();

      // Restar 3 horas
      fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);

      // Formatear la fecha a 'yyyy-MM-dd HH:mm'
      const formattedFechaHoraActual = fechaHoraActual
        .toISOString()
        .slice(0, 16) // 'yyyy-MM-ddTHH:mm'
        .replace("T", " "); // Cambia 'T' por un espacio

      // Formatear la fecha a 'yyyy-MM-dd HH:mm'
      const formattedFechaActual = fechaHoraActual.toISOString().slice(0, 10); // 'yyyy-MM-dd'

      // Aca tenemos que diferenciar que tipo de usuario esta eliminando el servicio, para ver a quien le mandamos la notificacion
      const userType = req.body.execUserType;

      const userId = req.body.userId; // id del usuario que va a recibir la notificacion
      const fecha = req.body.fecha;
      const fechaFormateada = format(fecha, "dd/MM/yyyy");

      const nombreCliente = req.body.nombreCliente ?? null;

      // busco una factura asociada al servicio
      const bill = await Bill.findOne({
        where: { ServiceId: id },
        transaction: t,
      });

      if (bill) {
        // si existe
        //elimino la factura
        await bill.destroy({
          transaction: t,
        });

        const clientTargetSocket = getSocketByUserId(bill.Service.ClientId);
        if (clientTargetSocket) {
          clientTargetSocket[1].emit("refreshBills");
        }
      }

      // Elimina el servicio
      const deleteService = await Service.destroy({
        where: { id: id },
        transaction: t,
      });

      if (deleteService) {
        res.status(200).json({
          ok: true,
          status: 200,
          message: "Servicio eliminado exitosamente",
        });
      } else {
        res.status(404).json({
          ok: false,
          status: 404,
          message: "Servicio no encontrado",
        });
      }

      const io = getIO(); // Obtén la instancia de io

      // Función auxiliar para obtener el socket de un usuario por userId
      function getSocketByUserId(userId) {
        const socketEntry = Array.from(io.sockets.sockets).find(
          ([, socket]) =>
            socket.handshake.auth.userId.toString() === userId.toString()
        );

        return socketEntry ? socketEntry[1] : null; // Devolver solo el socket
      }

      let notification;

      if (userType === "walker") {
        notification = await Notification.create(
          {
            titulo: "Servicio cancelado",
            contenido: `El servicio para la fecha ${fechaFormateada} ha sido cancelado`,
            userId: userId,
            fechaHora: formattedFechaHoraActual,
          },
          { transaction: t }
        );

        // Emitir la notificacion mediante socket.io
        const targetSocket = getSocketByUserId(userId);
        if (targetSocket) {
          targetSocket.emit("notification", notification.toJSON());
          targetSocket.emit("refreshServices");
        }
      } else if (userType === "client") {
        notification = await Notification.create(
          {
            titulo: "Servicio cancelado",
            contenido: `El usuario ${nombreCliente} ha cancelado el servicio para la fecha ${fechaFormateada}`,
            userId: userId,
            fechaHora: formattedFechaHoraActual,
          },
          { transaction: t }
        );

        // Emitir la notificacion mediante socket.io
        const targetSocket = getSocketByUserId(userId);
        if (targetSocket) {
          targetSocket.emit("notification", notification.toJSON());
          targetSocket.emit("refreshServices");
        }
      } else {
        //si no viene lo que espero en walker, hago rollback
        await t.rollback();
        res.status(500).json({
          ok: false,
          status: 500,
          message: "Tipo de usuario no valido",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        status: 500,
        message: "Error al eliminar servicio",
        error: error.message,
      });
      console.error("Error al eliminar servicio:", error);
    });
});

// Marcar servicio como comenzado
router.put("/services/started/:service_id", async (req, res) => {
  sequelize
    .transaction(async (t) => {
      const id = req.params.service_id;

      // Verificar si el servicio existe
      const existingService = await Service.findOne({
        where: { id: id },
        transaction: t,
      });

      if (!existingService) {
        return res.status(404).json({
          ok: false,
          status: 404,
          message: "Servicio no encontrado",
        });
      }

      // verifico si es el primer servicio del turno que se ha comenzado
      const turn = await Turn.findByPk(existingService.TurnId, {
        transaction: t,
      });
      const firstService = await Service.findOne({
        where: { TurnId: turn.id, comenzado: true, finalizado: false },
        transaction: t,
      });

      // Actualiza el servicio
      await Service.update(
        {
          comenzado: true,
        },
        {
          where: { id: id },
          transaction: t,
        }
      );

      if (!firstService) {
        // si no exisita un servicio comenzado
        // emito un evento en el socket avisando que comenzo el turno
        const targetSocket = getSocketByUserId(turn.WalkerId);
        console.log("targetSocket: ", targetSocket);
        if (targetSocket) {
          targetSocket[1].emit("startOrFinishTurn", { id: turn.id });
          console.log("emito evento de comenzar turno");
        }
      }

      // emito evento al cliente
      const clientSocket = getSocketByUserId(existingService.ClientId);
      if (clientSocket) {
        clientSocket[1].emit("serviceStarted", { id: existingService.id });
        console.log("emito evento de comenzar servicio");
      }

      res.status(200).json({
        ok: true,
        status: 200,
        message: `El servicio con id ${id} ha comenzado`,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        status: 500,
        message: "Error al iniciar el servicio",
        error: error.message,
      });
      console.error("Error al iniciar el servicio:", error);
    });
});

// Marcar servicio como finalizado
router.put("/services/finished/:service_id", async (req, res) => {
  sequelize
    .transaction(async (t) => {
      const id = req.params.service_id;

      // Verificar si el servicio existe
      const existingService = await Service.findOne({
        where: { id: id },
        transaction: t,
      });

      if (!existingService) {
        return res.status(404).json({
          ok: false,
          status: 404,
          message: "Servicio no encontrado",
        });
      }

      // Actualiza el servicio
      await Service.update(
        {
          finalizado: true,
        },
        {
          where: { id: id },
          transaction: t,
        }
      );

      //traigo la factura asociada al servicio
      const bill = await Bill.findOne({
        where: { ServiceId: id },
        transaction: t,
      });

      if (!bill) {
        return res.status(404).json({
          ok: false,
          status: 404,
          message: "El servicio no tiene una factura asociada",
        });
      }

      // marco la factura como pagada
      await bill.update(
        {
          pagado: true,
          pendiente: false,
        },
        {
          transaction: t,
        }
      );

      // verifico si hay algun servicio activo
      const turn = await Turn.findByPk(existingService.TurnId, {
        transaction: t,
      });
      const activeService = await Service.findOne({
        where: { TurnId: turn.id, comenzado: true, finalizado: false },
        transaction: t,
      });
      if (!activeService) {
        // emito un evento en el socket avisando que finalizo el turno
        const targetSocket = getSocketByUserId(turn.WalkerId);
        if (targetSocket) {
          targetSocket[1].emit("startOrFinishTurn", { id: turn.id });
          console.log("emito evento de finalizar turno");
        }
      }

      //busco el socket del cliente
      const clientSocket = getSocketByUserId(existingService.ClientId);
      if (clientSocket) {
        clientSocket[1].emit("serviceFinished", { id: existingService.id });
        console.log("emito evento de finalizar servicio");
      }

      res.status(200).json({
        ok: true,
        status: 200,
        message: `El servicio con id ${id} ha finalizado`,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        status: 500,
        message: "Error al finalizar el servicio",
        error: error.message,
      });
      console.error("Error al finalizar el servicio:", error);
    });
});

module.exports = router;
