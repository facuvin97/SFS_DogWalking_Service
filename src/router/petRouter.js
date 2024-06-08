const { Router } = require('express');
const Pet = require("../models/Pet");
const Client = require("../models/Client");
const sequelize = require('../config/db.js');
const router = Router();

router.get("/pets", async (req, res) => {
  try {
    const pets = await Pet.findAll({
      include: Client
    });
    res.status(200).json({
      ok: true,
      status: 200,
      body: pets
    });
  } catch (error) {
    res.status(500).send('Error al obtener mascotas');
    console.error('Error al obtener mascotas:', error);
  }
});

router.get("/pets/:pet_id", async (req, res) => {
  try {
    const id = req.params.pet_id;
    const pet = await Pet.findOne({
      where: {
        id: id
      },
      include: Client
    });
    if (pet) {
      res.status(200).json({
        ok: true,
        status: 200,
        body: pet
      });
    } else {
      res.status(404).json({
        ok: false,
        status: 404,
        message: "Mascota no encontrada"
      });
    }
  } catch (error) {
    res.status(500).send('Error al obtener mascota');
    console.error('Error al obtener mascota:', error);
  }
});

router.post("/pets", async (req, res) => {
    const petData = req.body;
  
    try {
      const pet = await sequelize.transaction(async (t) => {
        // Crea la mascota
        const newPet = await Pet.create({
          name: petData.name,
          breed: petData.breed,
          size: petData.size,
          age: petData.age,
          image: petData.image,
          clientId: petData.clientId
        }, { transaction: t });
  
        return newPet;
      });
  
      res.status(201).json({
        ok: true,
        status: 201,
        body: pet,
        message: "Mascota creada exitosamente",
      });
    } catch (error) {
      console.error('Error al crear mascota:', error);
      res.status(500).send('Error al crear mascota');
    }
  });

  router.put("/pets/:pet_id", async (req, res) => {
    const petData = req.body;
    const id = req.params.pet_id;
  
    try {
      const result = await sequelize.transaction(async (t) => {
        // Modifica la mascota
        const [updatedRows] = await Pet.update({
          name: petData.name,
          breed: petData.breed,  // Aquí se corrige 'breed' en lugar de 'species'
          size: petData.size,
          age: petData.age,
          image: petData.image,
          clientId: petData.clientId
        }, 
        { 
          transaction: t,
          where: {
            id: id
          }
        });
  
        if (updatedRows === 0) {
          throw new Error('No se encontró la mascota con el ID proporcionado.');
        }
  
        return updatedRows;
      });
  
      res.status(200).json({
        ok: true,
        status: 200,
        message: "Mascota modificada exitosamente",
      });
    } catch (error) {
      // Si algo falla, revierte la transacción
      console.error('Error al modificar mascota:', error);
      res.status(500).send('Error al modificar mascota');
    }
  });

router.delete("/pets/:pet_id", (req, res) => {
  sequelize.transaction(async (t) => {
    const id = req.params.pet_id;

    // Elimina la mascota
    const deletePet = await Pet.destroy({
      where: {
        id: id
      },
      transaction: t
    });

    if (deletePet != 0) {
      res.status(200).json({
        ok: true,
        status: 200,
        message: "Mascota eliminada exitosamente"
      });
    } else {
      res.status(404).json({
        ok: false,
        status: 404,
        message: "Mascota no encontrada"
      });
    }
  }).catch((error) => {
    // Si algo falla, revierte la transacción
    res.status(500).send('Error al eliminar mascota');
    console.error('Error al eliminar mascota:', error);
  });
});

module.exports = router
