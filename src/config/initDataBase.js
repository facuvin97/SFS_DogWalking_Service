const sequelize = require('./db.js');

async function initDatabase() {
  try {
      await sequelize.sync();
      console.log('¡Tablas sincronizadas!');
  } catch (error) {
      console.error('Error al sincronizar tablas:', error);
  }
}

module.exports = initDatabase;