const express = require('express')
const morgan = require('morgan')

const routerClient = require("../router/clientRouter")
const routerWalker = require("../router/walkerRouter")
const routerUser = require("../router/userRouter")

const app = express();

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

app.use("/api/v1", routerClient);
app.use("/api/v1", routerWalker);
app.use("/api/v1", routerUser);

module.exports = app