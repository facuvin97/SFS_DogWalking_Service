const Turn = require('../models/Turn.js')
const sequelize = require('../config/db.js');

const router = require("express").Router()

//Obtener los turnos de un paseador
router.get("/turns/:walker_id", async (req, res) => {
  const walkerId = req.params.walker_id;
  const turns = await Turn.findAll({
    where: {
      WalkerId: walkerId
    }
  })
  res.status(200).json({
    ok: true,
    status: 200,
    body: turns
  })
})

//Obtener un turno por su id
router.get("/turn/:turn_id", async (req, res) => {
  const id = req.params.turn_id;
  const turn = await Turn.findOne({
    where: {
      id: id
    }
  })
  res.status(200).json({
    ok: true,
    status: 200,
    body: turn
  })
})

//Agregar un turno
router.post("/turns", async (req, res) => {
  try {
    const turnData = req.body;

    // Crea el turno
    const turn = await Turn.create({
      dias: turnData.dias,
      hora_inicio: turnData.hora_inicio,
      hora_fin: turnData.hora_fin,
      tarifa: turnData.tarifa,
      zona: turnData.zona,
      WalkerId: turnData.WalkerId // Asigna el ID del Walker al turno
    });

    res.status(201).json({
      ok: true,
      status: 201,
      message: "Turno creado exitosamente",
      data: turn
    });
  } catch (error) {
    res.status(500).send('Error al crear turno');
    console.error('Error al crear turno:', error);
  }
});

//Modificar un turno
router.put("/turns/:turn_id", async (req, res) => {
  try {
    const id = req.params.turn_id;
    const turnData = req.body;

    // Actualiza el turno
    const updatedTurn = await Turn.update(
      {
        dias: turnData.dias,
        hora_inicio: turnData.hora_inicio,
        hora_fin: turnData.hora_fin,
        tarifa: turnData.tarifa,
        zona: turnData.zona,
        WalkerId: turnData.WalkerId // Asigna el ID del Walker al turno
      },
      {
        where: {
          id: id
        }
      }
    );

    res.status(200).json({
      ok: true,
      status: 200,
      message: "Turno modificado exitosamente"
    });
  } catch (error) {
    res.status(500).send('Error al modificar turno');
    console.error('Error al modificar turno:', error);
  }
});


router.delete("/turns/:turn_id", async (req, res) => {
  try {
    const id = req.params.turn_id;

    // Elimina el turno
    const deleteTurn = await Turn.destroy({
      where: {
        id: id
      }
    });

    if (deleteTurn !== 0) {
      res.status(200).json({
        ok: true,
        status: 200,
        message: "Turno eliminado exitosamente"
      });
    } else {
      res.status(404).json({
        ok: false,
        status: 404,
        message: "No se encontró el turno"
      });
    }
  } catch (error) {
    res.status(500).send('Error al eliminar turno');
    console.error('Error al eliminar turno:', error);
  }
});


module.exports = router