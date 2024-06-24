const sequelize = require('./db.js'); // tu configuración de sequelize
const models = sequelize.models;

async function cleanupIndexes() {
  try {
    for (const modelName in models) {
      if (models.hasOwnProperty(modelName)) {
        const model = models[modelName];
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
    }
  } catch (error) {
    console.error('Error al limpiar índices:', error);
  }
}

// Ejecutar el script de limpieza de índices y luego sincronizar la base de datos
async function initDatabase() {
  try {
    await sequelize.sync({ alter: true }); // Opción 'alter' para sincronización no destructiva
    await cleanupIndexes();
    console.log('Sincronización completada.');
  } catch (error) {
    console.error('Error durante la inicialización:', error);
  }
}

initDatabase().then(() => {
  console.log('Índices limpiados y base de datos sincronizada.');
}).catch(error => {
  console.error('Error durante la inicialización:', error);
});


/* async function initDatabase() {
  try {
      await sequelize.sync();
      console.log('¡Tablas sincronizadas!');
  } catch (error) {
      console.error('Error al sincronizar tablas:', error);
  }
} */

module.exports = initDatabase;