const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

const authMiddleware = require('../middlewares/authMiddleware')
const routerClient = require("../router/clientRouter")
const routerWalker = require("../router/walkerRouter")
const routerUser = require("../router/userRouter")
const routerTurn = require("../router/turnRouter")
const routerService = require("../router/serviceRouter")
const routerNotification = require("../router/notificationRouter")
const routerPet = require("../router/petRouter")
const routerReview = require("../router/reviewRouter")
const routerBill = require("../router/billRuter")
const routerPayment = require("../router/paymentRouter")
const routerMessage = require("../router/messageRouter")
const errorHandler = require('../middlewares/error')


const app = express();

const version = "/api/v1";

app.use(express.static('images'));


app.use(morgan("dev")) 


app.use(cors({
  origin: '*', // Esto permite cualquier origen. Puedes especificar el dominio exacto si prefieres.
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Si necesitas enviar cookies o headers de autenticación
}));

// Middleware para analizar el cuerpo de la solicitud en formato JSON
app.use(express.json());


// **Manejadores globales de errores**
process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err);
  process.exit(1); // Opcional: Salir del proceso en errores críticos
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada sin manejar:', reason);
});

app.get("/", (req, res) => {
  res.send('This is Express')
});

app.use(version, routerClient);
app.use(version, routerWalker);
app.use(version, routerUser);
app.use(version, authMiddleware, routerTurn);
app.use(version, authMiddleware, routerService);
app.use(version, authMiddleware, routerNotification);
app.use(version, authMiddleware, routerPet)
app.use(version, authMiddleware, routerReview)
app.use(version, authMiddleware, routerBill)
app.use(version, authMiddleware, routerPayment)
app.use(version, authMiddleware, routerMessage)

app.use(errorHandler)

module.exports = app