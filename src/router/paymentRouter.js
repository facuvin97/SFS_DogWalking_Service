const Walker = require("../models/Walker")
const sequelize = require('../config/db.js');
const router = require("express").Router()



  // asociar mercado pago
  router.put("/payments/mpassociation/:walker_id", async (req, res) => {
    try {
      const reqData = req.body
      const id = req.params.walker_id
    
      // modifica el paseador
      const walker = await Walker.update({
        mercadopago: reqData.code,
        fecha_mercadopago: new Date()
      }, 
      { 
        where: {
          id: id
        }
      });
      res.status(200).json({
        ok: true,
        status: 200,
        token: reqData.code,
      });
    } catch(error) {
      res.status(500).send('Error al modificar mercadopago');
      console.error('Error al modificar mercadopago:', error);
    };
  })

  // modificar metodos de cobro
  router.put("/payments/manage/:walker_id", async (req, res) => {
    try {
      const reqData = req.body;
      const id = req.params.walker_id;
  
      const { mercadopago, efectivo } = reqData;
  
      // Verifica si al menos un método de cobro está habilitado
      if (!mercadopago && !efectivo) {
        return res.status(400).send('Debe tener al menos un método de cobro disponible');
      }
  
      // Modifica el paseador
      const walker = await Walker.update(
        {
          mercadopago: mercadopago,
          efectivo: efectivo,
        },
        {
          where: {
            id: id,
          },
        }
      );
  
      res.status(200).json({
        ok: true,
        status: 200,
        message: "Método de cobro actualizado",
      });
    } catch (error) {
      res.status(500).send('Error al modificar método de cobro');
      console.error('Error al modificar método de cobro:', error);
    }
  });
  

module.exports = router