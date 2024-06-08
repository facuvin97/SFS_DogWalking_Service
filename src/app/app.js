const express = require('express')
const morgan = require('morgan')

const routerClient = require("../router/clientRouter")
const routerWalker = require("../router/walkerRouter")
const routerUser = require("../router/userRouter")
const routerTurn = require("../router/turnRouter")
const routerService = require("../router/serviceRouter")
const routerNotification = require("../router/notificationRouter")
const routerPet = require("../router/petRouter")

const app = express();

const version = "/api/v1";

app.use(express.static('images'));


app.use(morgan("dev")) 

// Permitir solicitudes desde cualquier origen
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

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

module.exports = app