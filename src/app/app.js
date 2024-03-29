const express = require('express')
const morgan = require('morgan')

const routerClient = require("../router/clientRouter")
const routerWalker = require("../router/walkerRouter")

const app = express();

app.use(morgan("dev"))

// Middleware para analizar el cuerpo de la solicitud en formato JSON
app.use(express.json());

app.get("/", (req, res) => {
  res.send('This is Express')
});

app.use("/api/v1", routerClient);
app.use("/api/v1", routerWalker);

module.exports = app