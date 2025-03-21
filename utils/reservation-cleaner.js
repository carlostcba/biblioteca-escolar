// utils/reservation-cleaner.js
const db = require('../models');
const Reserva = db.Reserva;
const Ejemplar = db.Ejemplar;
const { Op } = db.Sequelize;

/**
 * Verifica y actualiza las reservas vencidas
 * Esta función debe ejecutarse periódicamente (por ejemplo, cada día)
 */
async function cleanExpiredReservations() {
  try {
    console.log('Iniciando limpieza de reservas vencidas...');
    
    // Buscar reservas pendientes o listas que hayan expirado
    const reservasVencidas = await Reserva.findAll({
      where: {
        Estado: {
          [Op.in]: ['pendiente', 'lista']
        },
        FechaExpiracion: {
          [Op.lt]: new Date()
        }
      }
    });
    
    console.log(`Se encontraron ${reservasVencidas.length} reservas vencidas`);
    
    // Actualizar cada reserva y liberar ejemplares
    for (const reserva of reservasVencidas) {
      await db.sequelize.transaction(async (t) => {
        // Actualizar estado de la reserva
        await Reserva.update(
          { Estado: 'vencida' },
          { 
            where: { ReservaID: reserva.ReservaID },
            transaction: t
          }
        );
        
        // Si hay un ejemplar asignado, liberarlo
        if (reserva.EjemplarID) {
          await Ejemplar.update(
            { Estado: 'Disponible' },
            { 
              where: { EjemplarID: reserva.EjemplarID },
              transaction: t
            }
          );
          console.log(`Ejemplar ${reserva.EjemplarID} liberado de la reserva ${reserva.ReservaID}`);
        }
      });
      
      console.log(`Reserva ${reserva.ReservaID} marcada como vencida`);
    }
    
    console.log('Limpieza de reservas vencidas completada');
    return { 
      success: true, 
      processed: reservasVencidas.length 
    };
    
  } catch (error) {
    console.error('Error al limpiar reservas vencidas:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Si el script se ejecuta directamente
if (require.main === module) {
  cleanExpiredReservations()
    .then(result => {
      console.log('Resultado:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error general:', error);
      process.exit(1);
    });
}

module.exports = cleanExpiredReservations;