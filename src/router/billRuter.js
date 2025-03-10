const Servicio = require("../models/Service.js");
const Notification = require("../models/Notification.js");
const Bill = require("../models/Bill.js");
const sequelize = require("../config/db.js");
const Service = require("../models/Service.js");
const Walker = require("../models/Walker.js");
const Turn = require("../models/Turn.js");
const Client = require("../models/Client.js");
const User = require("../models/User.js");
const router = require("express").Router();
const { format } = require("date-fns");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const globalConstants = require("../const/globalConstants.js");
const { getSocketByUserId } = require("../config/socket.js");
const { response } = require("../app/app.js");

// Endpoint para crear una preferencia de pago
router.post("/bills/pay", async (req, res) => {
  try {
    const { billId } = req.body; // ID de la factura
    // Obtener la factura por su ID
    const bill = await Bill.findByPk(billId, {
      include: {
        model: Service, // Incluir el modelo Service
        include: {
          model: Turn, // Incluir el modelo Turn dentro de Service
          paranoid: false,
          include: {
            model: Walker, // Incluir el modelo Walker dentro de Turn
          },
        },
      },
    });

    if (!bill) {
      return res.status(404).json({
        ok: false,
        status: 404,
        message: "Factura no encontrada",
      });
    }

    const monto = parseFloat(bill.monto);

    if (isNaN(monto)) {
      return res.status(400).json({
        ok: false,
        status: 400,
        message: "El monto de la factura no es un número válido",
      });
    }

    const walker = bill.Service.Turn.Walker;
    // Inicializar MercadoPagoConfig con el access token del paseador
    const client = new MercadoPagoConfig({
      accessToken: walker.access_token, // Access token del paseador
    });

    const body = {
      items: [
        {
          title: `Servicio Nº: ${bill.ServiceId}`, // Título del servicio
          quantity: 1,
          unit_price: monto, // Monto de la factura
          currency_id: "UY", // Moneda (Uruguay)
        },
      ],
      back_urls: {
        success: `${globalConstants.EXTERNAL_URI}/success-payment`,
        failure: `${globalConstants.EXTERNAL_URI}/failure`,
        pending: `${globalConstants.EXTERNAL_URI}/pending`,
      },
      auto_return: "approved",
    };

    // Crear la preferencia de pago en MercadoPago
    const preference = new Preference(client);
    const result = await preference.create({ body });

    // Devolver el ID de la preferencia creada y la public key para usar en el frontend
    res.json({
      id: result.id, // ID de la preferencia
      publicKey: walker.public_key, // Public key del paseador
      url: result.body.init_point, // URL de MercadoPago para redirigir al cliente
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Error al crear la preferencia :(",
    });
  }
});

router.get("/success", (req, res) => {
  res.redirect("http://localhost:5173/success"); // URL del frontend
});

router.get("/failure", (req, res) => {
  res.redirect("http://localhost:5173/failure"); // URL del frontend
});

router.get("/pending", (req, res) => {
  res.redirect("http://localhost:5173/pending"); // URL del frontend
});

//Obtener los facturas de un cliente
router.get("/bills/client/:client_id", async (req, res) => {
  const clientId = req.params.client_id;
  const bills = await Bill.findAll({
    include: {
      model: Service,
      where: {
        ClientId: clientId,
      },
      include: {
        model: Turn,
        attributes: ["WalkerId"],
        paranoid: false,
        include: {
          model: Walker,
          attributes: ["mercadopago", "efectivo"],
          include: {
            model: User,
            attributes: ["nombre_usuario"],
          },
        },
      },
    },
  });
  res.status(200).json({
    ok: true,
    status: 200,
    body: bills,
  });
});

//Obtener un factura por su id
router.get("/bills/:bill_id", async (req, res) => {
  const id = req.params.bill_id;
  const bill = await Bill.findOne({
    where: {
      id: id,
    },
  });
  res.status(200).json({
    ok: true,
    status: 200,
    body: bill,
  });
});

//Pagar un factura
router.put("/bills/:bill_id", async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const reqData = req.body;
    const { pagado, pendiente } = reqData;

    const id = req.params.bill_id;

    // Verificar si la factura existe
    const existingBill = await Bill.findOne({
      where: { id: id },
      include: {
        model: Service,
        paranoid: false,
      },
      transaction: t,
    });

    // Si la factura no existe
    if (!existingBill) {
      await t.rollback();
      return res.status(404).json({
        ok: false,
        status: 404,
        message: "Factura no encontrada",
      });
    }

    // Si la factura ya está pagada
    if (existingBill.pagado) {
      await t.rollback();
      return res.status(400).json({
        ok: false,
        status: 400,
        message: "La factura ya está pagada",
      });
    }
    if (pagado && pendiente) {
      await t.rollback();
      return res.status(400).json({
        ok: false,
        status: 400,
        message: "La factura no puede ser pagada y pendiente a la vez",
      });
    }
    if (!pagado && !pendiente) {
      await t.rollback();
      return res.status(400).json({
        ok: false,
        status: 400,
        message: "No se realizo ninguna acciòn",
      });
    }

    // Actualiza la Factura
    await Bill.update(
      {
        pagado: pagado,
        pendiente: pendiente,
      },
      {
        where: { id: id },
        transaction: t,
      }
    );

    const clientTargetSocket = getSocketByUserId(existingBill.Service.ClientId);
    if (clientTargetSocket) {
      clientTargetSocket[1].emit("refreshBills");
    }

    const service = await Service.findByPk(existingBill.ServiceId, {
      include: { model: Client, include: { model: User } },
      transaction: t,
    });
    const turn = await Turn.findByPk(service.TurnId, { transaction: t });

    // Obtener la fecha y hora actual
    const fechaHoraActual = new Date();

    // Restar 3 horas
    fechaHoraActual.setHours(fechaHoraActual.getHours() - 3);

    // Formatear la fecha a 'yyyy-MM-dd HH:mm'
    const formattedFechaHoraActual = fechaHoraActual
      .toISOString()
      .slice(0, 16) // 'yyyy-MM-ddTHH:mm'
      .replace("T", " "); // Cambia 'T' por un espacio

    // Enviar una notificación al paseador
    if (!pendiente && pagado) {
      const notification = await Notification.create(
        {
          titulo: "Factura pagada",
          contenido: `Su servicio del día ${service.fecha}, con el cliente ${service.Client.User.nombre_usuario} ha sido pagado`,
          userId: turn.WalkerId,
          fechaHora: formattedFechaHoraActual,
        },
        { transaction: t }
      );

      const targetSocket = getSocketByUserId(turn.WalkerId);
      if (targetSocket) {
        targetSocket[1].emit("notification", notification.toJSON());
      }

      await t.commit();
      return res.status(200).json({
        ok: true,
        status: 200,
        message: "Factura pagada exitosamente",
      });
    }

    if (pendiente && !pagado) {
      const notification = await Notification.create(
        {
          titulo: "Factura pendiente",
          contenido: `Su servicio del día ${service.fecha}, con el cliente ${service.Client.User.nombre_usuario} esta pendiente de pago.`,
          userId: turn.WalkerId,
          fechaHora: formattedFechaHoraActual,
        },
        { transaction: t }
      );

      const targetSocket = getSocketByUserId(turn.WalkerId);
      if (targetSocket) {
        targetSocket[1].emit("notification", notification.toJSON());
      }

      await t.commit();

      return res.status(200).json({
        ok: true,
        status: 200,
        message: "La factura tiene el pago pendiente",
      });
    }
  } catch (error) {
    await t.rollback();
    console.error("Error al pagar factura:", error);
    return res.status(500).send("Error al pagar factura");
  }
});

module.exports = router;
