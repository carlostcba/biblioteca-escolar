// controllers/dashboard.controller.js
const db = require('../models');
const { Op } = require('sequelize');

exports.getEstadisticas = async (req, res) => {
  try {
    // Calcular fechas para tendencias
    const hoy = new Date();
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hoy.getDate() - 7);
    const hace14Dias = new Date(hoy);
    hace14Dias.setDate(hoy.getDate() - 14);

    // ===== PRÉSTAMOS ACTIVOS =====
    // Contar préstamos activos actuales
    const prestamosActivos = await db.Prestamo.count({ 
      where: { Estado: 'Activo' } 
    });

    // Calcular tendencia: préstamos nuevos esta semana vs semana anterior
    const prestamosNuevosEstaSemana = await db.Prestamo.count({
      where: {
        Estado: 'Activo',
        FechaCreacion: {
          [Op.between]: [hace7Dias, hoy]
        }
      }
    });

    const prestamosNuevosSemanaAnterior = await db.Prestamo.count({
      where: {
        Estado: 'Activo',
        FechaCreacion: {
          [Op.between]: [hace14Dias, hace7Dias]
        }
      }
    });

    // Calcular tendencia porcentual para préstamos
    let tendenciaPrestamos = 0;
    if (prestamosNuevosSemanaAnterior > 0) {
      tendenciaPrestamos = ((prestamosNuevosEstaSemana - prestamosNuevosSemanaAnterior) / prestamosNuevosSemanaAnterior) * 100;
    } else if (prestamosNuevosEstaSemana > 0) {
      tendenciaPrestamos = 100; // Si no hubo préstamos la semana anterior pero sí esta semana
    }

    // ===== PRÉSTAMOS VENCIDOS =====
    // Contar préstamos vencidos actuales
    const prestamosVencidos = await db.Prestamo.count({ 
      where: { 
        Estado: 'Activo', 
        FechaDevolucion: { [Op.lt]: hoy } 
      } 
    });

    // Préstamos que vencieron esta semana
    const vencidosEstaSemana = await db.Prestamo.count({
      where: {
        Estado: 'Activo',
        FechaDevolucion: {
          [Op.lt]: hoy,
          [Op.gte]: hace7Dias
        }
      }
    });

    // Préstamos que vencieron la semana anterior
    const vencidosSemanaAnterior = await db.Prestamo.count({
      where: {
        Estado: 'Activo',
        FechaDevolucion: {
          [Op.lt]: hace7Dias,
          [Op.gte]: hace14Dias
        }
      }
    });

    // Calcular tendencia porcentual para vencidos
    let tendenciaVencidos = 0;
    if (vencidosSemanaAnterior > 0) {
      tendenciaVencidos = ((vencidosEstaSemana - vencidosSemanaAnterior) / vencidosSemanaAnterior) * 100;
    } else if (vencidosEstaSemana > 0) {
      tendenciaVencidos = 100; // Si no hubo vencidos la semana anterior pero sí esta semana
    }

    // ===== EJEMPLARES DISPONIBLES =====
    const ejemplaresDisponibles = await db.Ejemplar.count({ 
      where: { Estado: 'Disponible' } 
    });

    const totalEjemplares = await db.Ejemplar.count();
    const porcentajeDisponibilidad = totalEjemplares > 0 
      ? (ejemplaresDisponibles / totalEjemplares) * 100 
      : 0;

    // ===== RESERVAS PENDIENTES =====
    const reservasPendientes = await db.Reserva.count({ 
      where: { Estado: 'Pendiente' } 
    });

    // Reservas nuevas esta semana
    const reservasNuevasEstaSemana = await db.Reserva.count({
      where: {
        Estado: 'Pendiente',
        FechaCreacion: {
          [Op.between]: [hace7Dias, hoy]
        }
      }
    });

    // ===== ESTADÍSTICAS ADICIONALES =====
    // Top 5 libros más prestados (últimos 30 días)
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hoy.getDate() - 30);

    const librosMasPrestados = await db.Prestamo.findAll({
      attributes: [
        [db.sequelize.col('ejemplar.libro.LibroID'), 'libroId'],
        [db.sequelize.col('ejemplar.libro.Titulo'), 'titulo'],
        [db.sequelize.fn('COUNT', db.sequelize.col('PrestamoID')), 'total']
      ],
      include: [{
        model: db.Ejemplar,
        as: 'ejemplar',
        attributes: [],
        include: [{
          model: db.Libro,
          as: 'libro',
          attributes: []
        }]
      }],
      where: {
        FechaCreacion: {
          [Op.gte]: hace30Dias
        }
      },
      group: ['ejemplar.libro.LibroID', 'ejemplar.libro.Titulo'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('PrestamoID')), 'DESC']],
      limit: 5,
      raw: true
    }).catch(err => {
      console.error('Error al obtener libros más prestados:', err);
      return [];
    });

    // Tasa de devolución a tiempo (últimos 30 días)
    const prestamosCompletados = await db.Prestamo.count({
      where: {
        FechaDevolucionReal: {
          [Op.not]: null,
          [Op.gte]: hace30Dias
        }
      }
    });

    const devolucionesATiempo = await db.Prestamo.count({
      where: {
        FechaDevolucionReal: {
          [Op.not]: null,
          [Op.gte]: hace30Dias
        },
        FechaDevolucion: {
          [Op.gte]: db.sequelize.col('FechaDevolucionReal')
        }
      }
    });

    const tasaDevolucionATiempo = prestamosCompletados > 0 
      ? (devolucionesATiempo / prestamosCompletados) * 100 
      : 0;

    // Enviar resultados como JSON
    res.status(200).json({
      prestamosActivos,
      prestamosVencidos,
      ejemplaresDisponibles,
      reservasPendientes,
      tendencias: {
        prestamosActivos: parseFloat(tendenciaPrestamos.toFixed(1)),
        prestamosVencidos: parseFloat(tendenciaVencidos.toFixed(1))
      },
      estadisticasAdicionales: {
        totalEjemplares,
        porcentajeDisponibilidad: parseFloat(porcentajeDisponibilidad.toFixed(1)),
        reservasNuevasSemana: reservasNuevasEstaSemana,
        librosMasPrestados,
        tasaDevolucionATiempo: parseFloat(tasaDevolucionATiempo.toFixed(1)),
        prestamosCompletados
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    
    // Responder con error detallado
    res.status(500).json({ 
      message: 'Error al obtener estadísticas', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};