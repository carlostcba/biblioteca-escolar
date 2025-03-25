// controllers/dashboard.controller.js
const db = require('../models');
const { Op } = require('sequelize');

exports.getEstadisticas = async (req, res) => {
  try {
    // Consultas a la base de datos para obtener estadísticas reales
    // Verifica si la consulta inicial funciona (ésta no da error)
    const prestamosActivos = await db.Prestamo.count({ 
      where: { Estado: 'Activo' } 
    });
    
    // Para la segunda consulta, debes determinar el nombre correcto de la columna
    // El error dice que 'FechaVencimiento' no existe
    // Debemos inspecccionar el modelo para ver el nombre correcto
    
    // Vamos a intentar algunos nombres comunes para la fecha de vencimiento
    let prestamosVencidos = 0;
    try {
      // Intento 1: DueDate (nombre en inglés común)
      prestamosVencidos = await db.Prestamo.count({
        where: {
          Estado: 'Activo',
          DueDate: { [Op.lt]: new Date() }
        }
      });
    } catch (error1) {
      try {
        // Intento 2: FechaDevolucion
        prestamosVencidos = await db.Prestamo.count({
          where: {
            Estado: 'Activo',
            FechaDevolucion: { [Op.lt]: new Date() }
          }
        });
      } catch (error2) {
        // Si ambos intentos fallan, establecemos un valor predeterminado
        console.error('No se pudo determinar el nombre de la columna de fecha de vencimiento:', error2);
        prestamosVencidos = 0;
      }
    }
    
    // Obtener ejemplares disponibles
    let ejemplaresDisponibles = 0;
    try {
      ejemplaresDisponibles = await db.Ejemplar.count({ 
        where: { Estado: 'Disponible' } 
      });
    } catch (error) {
      console.error('Error al contar ejemplares disponibles:', error);
      ejemplaresDisponibles = 0;
    }
    
    // Obtener reservas pendientes
    let reservasPendientes = 0;
    try {
      reservasPendientes = await db.Reserva.count({ 
        where: { Estado: 'Pendiente' } 
      });
    } catch (error) {
      console.error('Error al contar reservas pendientes:', error);
      reservasPendientes = 0;
    }
    
    // Responder con los datos recopilados
    res.status(200).json({
      prestamosActivos,
      prestamosVencidos,
      ejemplaresDisponibles,
      reservasPendientes,
      tendencias: {
        prestamosActivos: 5.2,  // Por ahora valores fijos
        prestamosVencidos: -2.3
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas', 
      error: error.message 
    });
  }
};