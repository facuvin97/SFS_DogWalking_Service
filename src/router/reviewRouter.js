const User = require("../models/User");
const Review = require("../models/Review.js");
const sequelize = require("../config/db.js");
const { Op } = require("sequelize");
const Service = require("../models/Service.js");

async function updateUserRating(userId) {
  const reviews = await Review.findAll({ where: { receiverId: userId } });
  const totalReviews = reviews.length;

  if (totalReviews > 0) {
    const sumRatings = reviews.reduce(
      (sum, review) => sum + review.valoracion,
      0
    );
    const averageRating = Math.round(sumRatings / totalReviews);

    await User.update(
      { calificacion: averageRating },
      { where: { id: userId } }
    );
  } else {
    await User.update({ calificacion: 0 }, { where: { id: userId } });
  }
}

const router = require("express").Router();

// Crear review
router.post("/review", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const reviewData = req.body;

    // Creo la review
    const review = await Review.create(
      {
        valoracion: reviewData.valoracion,
        descripcion: reviewData.descripcion,
        writerId: reviewData.writerId,
        receiverId: reviewData.receiverId,
      },
      { transaction: t }
    );

    // Aseguramos que updateUserRating se ejecute después del commit
    t.afterCommit(async () => {
      try {
        await updateUserRating(review.receiverId);
      } catch (error) {
        console.log(error.message);
      }
    });

    // Traigo los datos del servicio
    const service = await Service.findByPk(reviewData.serviceId, {
      transaction: t,
    });

    // Verifico que el servicio exista
    if (!service) {
      await t.rollback(); // Rollback si no se encuentra el servicio
      return res.status(404).json({
        ok: false,
        status: 404,
        message: "Servicio no encontrado",
      });
    }

    // Verifico que el servicio no esté calificado ya por ambos usuarios
    if (service.calificado_x_cliente && service.calificado_x_paseador) {
      await t.rollback(); // Rollback si el servicio ya fue calificado por ambos usuarios
      return res.status(400).json({
        ok: false,
        status: 400,
        message: "El servicio ya fue calificado por el cliente y el paseador",
      });
    }

    // Modifico el servicio para indicar por quien fue reseñado
    if (
      service.ClientId === reviewData.writerId &&
      !service.calificado_x_cliente
    ) {
      // Si la review la escribió el cliente y el servicio aún no fue calificado por un cliente
      await Service.update(
        {
          calificado_x_cliente: true,
        },
        {
          where: { id: service.id },
          transaction: t,
        }
      );
    } else if (!service.calificado_x_paseador) {
      // Sino, la review la escribió el paseador, si el servicio no fue calificado por un paseador
      await Service.update(
        {
          calificado_x_paseador: true,
        },
        {
          where: { id: service.id },
          transaction: t,
        }
      );
    } else {
      // Si el servicio ya fue calificado por el tipo de usuario que escribió la reseña
      await t.rollback(); // Rollback si el servicio ya fue calificado por el tipo de usuario que escribió la reseña
      return res.status(400).json({
        ok: false,
        status: 400,
        message: "El servicio ya fue calificado por su tipo de usuario",
      });
    }

    // Commit de la transacción
    await t.commit();
    res.status(201).json({
      ok: true,
      status: 201,
      message: "Review creada exitosamente",
      body: review,
    });
  } catch (error) {
    await t.rollback(); // Rollback en caso de error
    res.status(500).send("Error al crear review");
    console.error("Error al crear review:", error);
  }
});

// Obtener las review recibidas de un usuario
router.get("/review/receiver/:userId", async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: {
        receiverId: req.params.userId,
      },
      include: [
        {
          model: User,
          as: "writer",
        },
      ],
    });
    res.status(200).json({
      ok: true,
      status: 201,
      body: reviews,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Obtener las review enviadas de un usuario
router.get("/review/writer/:userId", async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: {
        writerId: req.params.userId,
      },
    });
    res.status(200).json({
      ok: true,
      status: 201,
      body: reviews,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
