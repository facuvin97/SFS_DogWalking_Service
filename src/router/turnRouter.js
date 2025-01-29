const Turn = require("../models/Turn.js");
const Servicio = require("../models/Service.js");
const Notification = require("../models/Notification.js");
const sequelize = require("../config/db.js");
const router = require("express").Router();

//Obtener los turnos de un paseador
router.get("/turns/walker/:walker_id", async (req, res) => {
  const walkerId = req.params.walker_id;
  const turns = await Turn.findAll({
    where: {
      WalkerId: walkerId,
    },
    include: Servicio,
  });
  res.status(200).json({
    ok: true,
    status: 200,
    body: turns,
  });
});

//Obtener un turno por su id
router.get("/turns/:turn_id", async (req, res) => {
  const id = req.params.turn_id;
  const turn = await Turn.findOne({
    where: {
      id: id,
    },
  });
  res.status(200).json({
    ok: true,
    status: 200,
    body: turn,
  });
});

//Agregar un turno
router.post("/turns", async (req, res) => {
  try {
    const turnData = req.body;

    // Crea el turno dentro de la transacción
    const turn = await Turn.create(
      {
        dias: turnData.dias,
        hora_inicio: turnData.hora_inicio,
        hora_fin: turnData.hora_fin,
        tarifa: turnData.tarifa,
        zona: turnData.zona,
        WalkerId: turnData.WalkerId, // Asigna el ID del Walker al turno
      },
    );

    console.log("turn: ", turn.dataValues.id);
    // Obtén el turno creado, incluyendo relaciones, dentro de la misma transacción
    const turnCreated = await Turn.findByPk(
      turn.dataValues.id,
      {       
        include: Servicio,
      },
    );

    
    console.log("turnCreated: ", turnCreated);
    res.status(201).json({
      ok: true,
      status: 201,
      message: "Turno creado exitosamente",
      data: turnCreated,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 500,
      message: error.message,
    });
    console.error("Error al crear turno:", error);
  }
});

//Modificar un turno
router.put("/turns/:turn_id", async (req, res) => {
  try {
    const id = req.params.turn_id;
    const turnData = req.body;

    // Verificar si el turno existe
    const existingTurn = await Turn.findOne({ where: { id: id } });

    if (!existingTurn) {
      return res.status(404).json({
        ok: false,
        status: 404,
        message: "Turno no encontrado",
      });
    }

    // Actualiza el turno
    await Turn.update(
      {
        dias: turnData.dias,
        hora_inicio: turnData.hora_inicio,
        hora_fin: turnData.hora_fin,
        tarifa: turnData.tarifa,
        zona: turnData.zona,
        WalkerId: turnData.WalkerId, // Asigna el ID del Walker al turno
      },
      {
        where: {
          id: id,
        },
      }
    );

    // Obtener el turno actualizado con los datos relacionados
    const updatedTurn = await Turn.findOne({
      where: { id: id },
      include: Servicio,
    });

    res.status(200).json({
      ok: true,
      status: 200,
      body: updatedTurn,
      message: "Turno modificado exitosamente",
    });
  } catch (error) {
    res.status(500).send("Error al modificar turno");
    console.error("Error al modificar turno:", error);
  }
});

router.delete("/turns/:turn_id", async (req, res) => {
  sequelize
    .transaction(async (t) => {
      const id = req.params.turn_id;

      // traigo todos los servicios del turno a eliminar
      const servicios = await Servicio.findAll({
        where: {
          TurnId: id,
        },
      });

      // Eliminar los servicios asociados al turno
      if (servicios.length > 0) {
        const deleteServices = await Servicio.destroy({
          where: {
            TurnId: id,
          },
          transaction: t,
        });
      }

      // Elimina el turno
      const deleteTurn = await Turn.destroy({
        where: {
          id: id,
        },
        transaction: t,
      });

      // Obtener la fecha y hora actual
      const fechaHoraActual = new Date();

      // Restar 3 horas
      fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);

      // Formatear la fecha a 'yyyy-MM-dd HH:mm'
      const formattedFechaHoraActual = fechaHoraActual
        .toISOString()
        .slice(0, 16) // 'yyyy-MM-ddTHH:mm'
        .replace("T", " "); // Cambia 'T' por un espacio

      // Enviar notificaciones
      if (servicios.length > 0) {
        for (const servicio of servicios) {
          const notification = await Notification.create({
              titulo: "Servicio cancelado",
              contenido: `El servicio para la fecha ${servicio.fecha} ha sido cancelado`,
              userId: servicio.ClientId,
              fechaHora: formattedFechaHoraActual,
            },
            { transaction: t }
          );
          const targetSocket = getSocketByUserId(servicio.ClientId);
          if (targetSocket) {
            targetSocket.emit('notification', notification.toJSON());
            targetSocket.emit('refreshServices');
          }
        }
      }

      if (deleteTurn !== 0) {
        res.status(200).json({
          ok: true,
          status: 200,
          message: "Turno eliminado exitosamente",
        });
      } else {
        res.status(404).json({
          ok: false,
          status: 404,
          message: "No se encontró el turno",
        });
      }
    })
    .catch((error) => {
      res.status(500).send("Error al eliminar turno");
      console.error("Error al eliminar turno:", error);
    });
});

module.exports = router;
