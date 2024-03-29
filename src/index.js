const app = require("./app/app")

const sequelize = require("./config/db");
const Client = require("./models/Client");
const Message = require("./models/Message");
const User = require("./models/User");
const Walker = require("./models/Walker")
const associations = require('./models/associations');


// Obtener todos los nombres de los modelos definidos
const modelNames = Object.keys(sequelize.models);

// Filtrar los modelos que son subclases de Sequelize.Model
const modelosSequelize = modelNames.filter(modelName => {
  const modelo = sequelize.models[modelName];
  return modelo.prototype instanceof sequelize.Sequelize.Model;
});

// Sincronizar modelos con la base de datos
sequelize.sync({ alter: true }).then(() => {
  console.log('¡Tablas sincronizadas!');
}).catch(err => {
  console.error('Error al sincronizar tablas :', err);
});



console.log("Modelos Sequelize:", modelosSequelize);

const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`Server runing on port ${port}`)
})