const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

const routerClient = require("../router/clientRouter")
const routerWalker = require("../router/walkerRouter")
const routerUser = require("../router/userRouter")
const routerTurn = require("../router/turnRouter")
const routerService = require("../router/serviceRouter")
const routerNotification = require("../router/notificationRouter")
const routerPet = require("../router/petRouter")
const routerReview = require("../router/reviewRouter")
const routerBill = require("../router/billRuter")

const app = express();

const version = "/api/v1";

app.use(express.static('images'));


app.use(morgan("dev")) 

// // Permitir solicitudes desde cualquier origen
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.setHeader('Access-Control-Allow-Credentials', true);
//   next();
// });

app.use(cors({
  origin: '*', // Esto permite cualquier origen. Puedes especificar el dominio exacto si prefieres.
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Si necesitas enviar cookies o headers de autenticación
}));

// Middleware para analizar el cuerpo de la solicitud en formato JSON
app.use(express.json());


app.get("/", (req, res) => {
  res.send('This is Express')
});

app.use(version, routerClient);
app.use(version, routerWalker);
app.use(version, routerUser);
app.use(version, routerTurn);
app.use(version, routerService);
app.use(version, routerNotification);
app.use(version, routerPet)
app.use(version, routerReview)
app.use(version, routerBill)

module.exports = app