// scheduler.js
const cron = require('node-cron');
const cleanExpiredReservations = require('./utils/reservation-cleaner');

// Ejecutar la limpieza de reservas todos los días a las 00:05
cron.schedule('5 0 * * *', async () => {
  console.log('Ejecutando limpieza programada de reservas vencidas');
  await cleanExpiredReservations();
});

console.log('Programador de tareas iniciado');