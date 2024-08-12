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
      const reqData = req.body
      const id = req.params.walker_id

      //si no tiene mercadopago ni efectivo, mando error
      if (!mercadopago || mercadopago=='') {
        if (!efectivo) {
          res.status(500).send('Debe tener al menos un metodo de cobro disponible')
        }
      }
    
      // modifica el paseador
      const walker = await Walker.update({
        mercadopago: reqData.mercadopago,
        efectivo: reqData.efectivo
      }, 
      { 
        where: {
          id: id
        }
      });
      res.status(200).json({
        ok: true,
        status: 200,
        message: "Metodo de cobro actualizado",
      });
    } catch(error) {
      res.status(500).send('Error al modificar metodo de cobro');
      console.error('Error al modificar metodo de cobro:', error);
    };
  })

module.exports = router