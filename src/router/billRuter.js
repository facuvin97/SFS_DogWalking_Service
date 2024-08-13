const Servicio = require('../models/Service.js')
const Notification = require('../models/Notification.js')
const Bill = require('../models/Bill.js')
const sequelize = require('../config/db.js');
const Service = require('../models/Service.js');
const Walker = require('../models/Walker.js');
const Turn = require('../models/Turn.js');
const Client = require('../models/Client.js');
const User = require('../models/User.js');
const router = require("express").Router()
const { format } = require('date-fns');
const { MercadoPagoConfig, Preference } = require("mercadopago")

const client = new MercadoPagoConfig({
  accessToken:"APP_USR-2635371829801721-081221-b15a1454e498fe6ac4564b9c780f7dc3-1914450028"//acces touken paseador
})

router.post('/bills/pay', async (req, res) => {
  try{
    const body ={
      items: [{
        title: req.body.title,
        quantity: Number(req.body.quantity),
        unit_price: Number(req.body.price),
        currency_id: "UY"
      }],
      back_urls: {
        success:"https://www.youtube.com", 
        failure:"https://www.youtube.com", 
        pending:"https://www.youtube.com" 
      },
      auto_return: "approved"        
    }
    const preference = new Preference(client)

    const result = await preference.create({ body })
    res.json({
        id: result.id
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      error:" Error el crear la preferencia :( "
    })
  }
})

router.get('/success', (req, res) => {
  res.redirect('http://localhost:5173/success'); // URL del frontend
});

router.get('/failure', (req, res) => {
  res.redirect('http://localhost:5173/failure'); // URL del frontend
});

router.get('/pending', (req, res) => {
  res.redirect('http://localhost:5173/pending'); // URL del frontend
});

//Obtener los facturas de un cliente
router.get("/bills/client/:client_id", async (req, res) => {
  const clientId = req.params.client_id;
  const bills = await Bill.findAll({
    include: {
      model: Service, 
      attributes: [], // No incluir ningún campo del Service
      where: {
        ClientId: clientId
      }
    }
  })
  res.status(200).json({
    ok: true,
    status: 200,
    body: bills
  })
})

//Obtener un factura por su id
router.get("/bills/:bill_id", async (req, res) => {
  const id = req.params.bill_id;
  const bill = await Bill.findOne({
    where: {
      id: id
    }
  })
  res.status(200).json({
    ok: true,
    status: 200,
    body: bill
  })
})

//Pagar un factura
router.put("/bills/:bill_id", async (req, res) => {
    const t = await sequelize.transaction();
  
    try {
      const id = req.params.bill_id;
  
      // Verificar si el turno existe
      const existingBill = await Bill.findOne({ where: { id: id }, transaction: t });
  
      // Si la factura no existe
      if (!existingBill) {
        
        await t.rollback();
        return res.status(404).json({
          ok: false,
          status: 404,
          message: "Factura no encontrada"
        });
      }
  
      // Si la factura ya está pagada
      if (existingBill.pagado) {
        await t.rollback();
        return res.status(400).json({
          ok: false,
          status: 400,
          message: "La factura ya está pagada"
        });
      }
  
      // Actualiza la Factura
      await Bill.update(
        {
          pagado: true
        },
        {
          where: { id: id }, transaction: t
        }
      );
  
      const service = await Service.findByPk(existingBill.ServiceId, {
        include: { model: Client, include: { model: User } },
        transaction: t
      });
      const turn = await Turn.findByPk(service.TurnId, { transaction: t });
  
      const fechaFormateada = format(service.fecha, 'dd/MM/yyyy');
  
      // Enviar una notificación al paseador
      await Notification.create({
        titulo: 'Factura pagada',
        contenido: `Su servicio del día ${fechaFormateada}, con el cliente ${service.Client.User.nombre_usuario} ha sido pagado`,
        userId: turn.WalkerId
      }, { transaction: t });
  
      await t.commit();
  
      return res.status(200).json({
        ok: true,
        status: 200,
        message: "Factura pagada exitosamente"
      });
    } catch (error) {
      await t.rollback();
      console.error('Error al pagar factura:', error);
      return res.status(500).send('Error al pagar factura');
    }
  });

module.exports = router