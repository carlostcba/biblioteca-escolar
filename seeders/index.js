// seeders/index.js
const seedRolesPermisos = require('./roles-permisos');
const db = require('../models');

/**
 * Ejecuta todos los seeders en secuencia
 */
const runSeeders = async () => {
  try {
    console.log('Iniciando proceso de seeding...');
    
    // Verificar conexión a la base de datos
    console.log('Verificando conexión a la base de datos...');
    try {
      await db.sequelize.authenticate();
      console.log('Conexión a la base de datos establecida correctamente.');
    } catch (dbError) {
      console.error('Error al conectar a la base de datos:', dbError);
      throw new Error('Error de conexión a la base de datos');
    }
    
    // Sincronizar modelos con la base de datos
    console.log('Sincronizando modelos...');
    await db.sequelize.sync({ force: false });
    console.log('Modelos sincronizados correctamente.');
    
    // Ejecutar seeders
    console.log('Ejecutando seeder de roles y permisos...');
    await seedRolesPermisos();
    console.log('Seeder de roles y permisos completado.');
    
    // Aquí se pueden agregar más seeders en el futuro
    
    console.log('Proceso de seeding completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error durante el proceso de seeding:', error);
    process.exit(1);
  }
};

// Ejecutar si este archivo es llamado directamente
if (require.main === module) {
  console.log('Iniciando ejecución del script de seeders...');
  runSeeders();
}

module.exports = runSeeders;