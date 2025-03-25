// controllers/dashboard.controller.js
const db = require('../models'); // Importar los modelos
const { Op } = require('sequelize'); // Importar operadores de Sequelize

exports.getEstadisticas = async (req, res) => {
  try {
    // Consultas a la base de datos para obtener estadísticas reales
    const prestamosActivos = await db.Prestamo.count({ 
      where: { Estado: 'Activo' } 
    });
    
    const prestamosVencidos = await db.Prestamo.count({ 
      where: { 
        Estado: 'Activo', 
        FechaVencimiento: { [Op.lt]: new Date() } 
      } 
    });
    
    const ejemplaresDisponibles = await db.Ejemplar.count({ 
      where: { Estado: 'Disponible' } 
    });
    
    const reservasPendientes = await db.Reserva.count({ 
      where: { Estado: 'Pendiente' } 
    });
    
    // Calcular tendencias reales (últimos 7 días vs 7 días anteriores)
    // Esta es una implementación más real para calcular tendencias
    const hoy = new Date();
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hoy.getDate() - 7);
    const hace14Dias = new Date(hoy);
    hace14Dias.setDate(hoy.getDate() - 14);
    
    // Préstamos de esta semana
    const prestamosEstaSemana = await db.Prestamo.count({
      where: {
        FechaCreacion: {
          [Op.between]: [hace7Dias, hoy]
        }
      }
    });
    
    // Préstamos de la semana anterior
    const prestamosSemanaAnterior = await db.Prestamo.count({
      where: {
        FechaCreacion: {
          [Op.between]: [hace14Dias, hace7Dias]
        }
      }
    });
    
    // Préstamos vencidos esta semana
    const vencidosEstaSemana = await db.Prestamo.count({
      where: {
        Estado: 'Activo',
        FechaVencimiento: {
          [Op.lt]: hoy,
          [Op.gte]: hace7Dias
        }
      }
    });
    
    // Préstamos vencidos semana anterior
    const vencidosSemanaAnterior = await db.Prestamo.count({
      where: {
        Estado: 'Activo',
        FechaVencimiento: {
          [Op.lt]: hace7Dias,
          [Op.gte]: hace14Dias
        }
      }
    });
    
    // Calcular porcentajes de tendencia
    let tendenciaPrestamos = 0;
    let tendenciaVencidos = 0;
    
    if (prestamosSemanaAnterior > 0) {
      tendenciaPrestamos = ((prestamosEstaSemana - prestamosSemanaAnterior) / prestamosSemanaAnterior) * 100;
    }
    
    if (vencidosSemanaAnterior > 0) {
      tendenciaVencidos = ((vencidosEstaSemana - vencidosSemanaAnterior) / vencidosSemanaAnterior) * 100;
    }
    
    res.status(200).json({
      prestamosActivos,
      prestamosVencidos,
      ejemplaresDisponibles,
      reservasPendientes,
      tendencias: {
        prestamosActivos: tendenciaPrestamos,
        prestamosVencidos: tendenciaVencidos
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