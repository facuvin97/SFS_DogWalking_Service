const { Sequelize } = require('sequelize');

// Configura la conexión a la base de datos
const sequelize = new Sequelize('proyecto_final_bios', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql'
});

// Testeo de conexion a la bdd
/*async function dbConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database online')
  } catch (error) {
    throw new Error( error );
  }
}

dbConnection()*/


module.exports = sequelize;
