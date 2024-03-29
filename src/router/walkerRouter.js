const User = require("../models/User")
const Walker = require("../models/Walker")

const router = require("express").Router()

router.get("/walkers", async (req, res) => {
  const walkers = await Walker.findAll({
    include: User
  })
  res.status(200).json({
    ok: true,
    status: 200,
    body: walkers
  })
})

router.get("/walkers/:walker_id", async (req, res) => {
  const id = req.params.walker_id;
  const walker = await Walker.findOne({
    where: {
      id: id
    },
    include: User
  })
  res.status(200).json({
    ok: true,
    status: 200,
    body: walker
  })
})

router.post("/walkers", (req, res) => {
  res.send("Agregar")
})

router.put("/walkers/:walker_id", (req, res) => {
  res.send("Modificar")
})

router.delete("/walkers/:walker_id", (req, res) => {
  res.send("Eliminar")
})

module.exports = router