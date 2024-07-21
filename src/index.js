const app = require("./app/app");

const sequelize = require("./config/db");
const Client = require("./models/Client");
const Message = require("./models/Message");
const User = require("./models/User");
const Walker = require("./models/Walker");
const associations = require('./models/associations');

// Obtener todos los nombres de los modelos definidos
const modelNames = Object.keys(sequelize.models);

// Filtrar los modelos que son subclases de Sequelize.Model
const modelosSequelize = modelNames.filter(modelName => {
  const modelo = sequelize.models[modelName];
  return modelo.prototype instanceof sequelize.Sequelize.Model;
});

async function cleanupIndexes() {
  try {
    for (const modelName of modelosSequelize) {
      const model = sequelize.models[modelName];
      const tableName = model.getTableName();

      // Mostrar los índices existentes para la tabla
      const [results] = await sequelize.query(`SHOW INDEX FROM ${tableName}`);

      // Filtrar índices que no sean la clave primaria y agrupar por nombre de columna
      const indices = results.filter(index => index.Key_name !== 'PRIMARY');
      const indicesMap = new Map();

      indices.forEach(index => {
        if (!indicesMap.has(index.Column_name)) {
          indicesMap.set(index.Column_name, []);
        }
        indicesMap.get(index.Column_name).push(index.Key_name);
      });

      // Eliminar índices redundantes, manteniendo solo uno por columna
      for (const [columnName, keyNames] of indicesMap.entries()) {
        // Mantener el primer índice y eliminar los demás
        for (let i = 1; i < keyNames.length; i++) {
          const keyName = keyNames[i];
          try {
            await sequelize.query(`DROP INDEX ${keyName} ON ${tableName}`);
            console.log(`Eliminado índice ${keyName} en la tabla ${tableName}`);
          } catch (error) {
            console.error(`Error al eliminar índice ${keyName} en la tabla ${tableName}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error al limpiar índices:', error);
  }
}

// Ejecutar el script de limpieza de índices y luego sincronizar la base de datos
async function initDatabase() {
  try {
    await cleanupIndexes();
    await sequelize.sync({ /*alter: true*/ }); // Opción 'alter' para sincronización no destructiva
    console.log('¡Tablas sincronizadas!');
  } catch (error) {
    console.error('Error durante la inicialización:', error);
  }
}

initDatabase().then(() => {
  console.log('Índices limpiados y base de datos sincronizada.');
}).catch(error => {
  console.error('Error durante la inicialización:', error);
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
