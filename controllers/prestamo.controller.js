// controllers/prestamo.controller.js
const db = require('../models');
const Prestamo = db.Prestamo;
const Ejemplar = db.Ejemplar;
const Libro = db.Libro;
const Autor = db.Autor;
const Op = db.Sequelize.Op;

// Crear un nuevo préstamo
exports.crear = async (req, res) => {
  try {
    // Validar la solicitud
    if (!req.body.EjemplarID || !req.body.UsuarioID) {
      res.status(400).send({
        message: "El ID del ejemplar y el ID del usuario son obligatorios"
      });
      return;
    }

    // Verificar que el ejemplar esté disponible
    const ejemplar = await Ejemplar.findByPk(req.body.EjemplarID);
    
    if (!ejemplar) {
      return res.status(404).send({
        message: "No se encontró el ejemplar."
      });
    }
    
    if (ejemplar.Estado !== 'Disponible') {
      return res.status(400).send({
        message: "El ejemplar no está disponible para préstamo."
      });
    }

    // Configurar fechas
    const fechaPrestamo = new Date();
    const fechaDevolucion = new Date();
    fechaDevolucion.setDate(fechaDevolucion.getDate() + (req.body.DiasPrestamo || 7)); // Por defecto 7 días

    // Crear un préstamo
    const prestamo = {
      EjemplarID: req.body.EjemplarID,
      UsuarioID: req.body.UsuarioID,
      FechaPrestamo: fechaPrestamo,
      FechaDevolucion: fechaDevolucion,
      Estado: 'activo',
      BibliotecarioID: req.body.BibliotecarioID || req.userId,
      Notas: req.body.Notas
    };

    // Guardar el préstamo en la base de datos
    const prestamoDB = await Prestamo.create(prestamo);
    
    // Actualizar estado del ejemplar
    await ejemplar.update({ Estado: 'Prestado' });
    
    res.status(201).send(prestamoDB);
  } catch (err) {
    console.error("Error al crear préstamo:", err);
    res.status(500).send({
      message: err.message || "Ocurrió un error al crear el préstamo."
    });
  }
};

// Obtener todos los préstamos
exports.obtenerTodos = async (req, res) => {
  try {
    // Obtener parámetros de consulta
    const tipo = req.query.tipo || 'Activos';
    const pagina = parseInt(req.query.pagina) || 1;
    const tamañoPagina = parseInt(req.query.size) || 10;
    
    // Calcular offset para paginación
    const offset = (pagina - 1) * tamañoPagina;
    
    // Configurar condición de filtro según el tipo
    let condicion = {};
    
    switch(tipo) {
      case 'activos':
        condicion.Estado = 'Activo';
        break;
      case 'vencidos':
        condicion.Estado = 'Vencido';
        break;
      case 'historial':
        condicion.Estado = 'Devuelto';
        break;
      // Si el tipo no es reconocido, mostrar todos
      default:
        break;
    }
    
    // Añadir filtros adicionales si se proporcionan
    if (req.query.usuario) {
      // Podrías implementar una búsqueda por relación con usuario
      // Por ejemplo, buscando por coincidencia en nombre/apellido
    }
    
    if (req.query.libro) {
      // Similar, búsqueda por título de libro en la relación
    }
    
    if (req.query.estado && tipo === 'historial') {
      condicion.Estado = req.query.estado;
    }
    
    // Realizar la consulta con los filtros y paginación
    const { count, rows } = await Prestamo.findAndCountAll({
      where: condicion,
      include: [
        {
          model: Ejemplar,
          as: 'ejemplar',
          include: [
            {
              model: Libro,
              as: 'libro',
              include: [
                {
                  model: Autor,
                  as: 'autor'
                }
              ]
            }
          ]
        },
        {
          model: db.Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido', 'email', 'tipo_usuario']
        }
      ],
      limit: tamañoPagina,
      offset: offset,
      order: [['FechaPrestamo', 'DESC']]
    });
    
    // Enviar respuesta paginada
    res.send({
      prestamos: rows,
      paginaActual: pagina,
      totalItems: count,
      totalPaginas: Math.ceil(count / tamañoPagina)
    });
  } catch (err) {
    console.error("Error al obtener préstamos:", err);
    res.status(500).send({
      message: err.message || "Ocurrió un error al obtener los préstamos."
    });
  }
};

// Obtener préstamos del usuario actual
exports.obtenerMisPrestamos = async (req, res) => {
  try {
    const userId = req.userId; // Obtenido del middleware authJwt
    
    console.log(`Obteniendo préstamos para el usuario ID: ${userId}`);
    
    const prestamos = await Prestamo.findAll({
      where: {
        UsuarioID: userId,
        Estado: ['activo', 'vencido'] // Solo préstamos activos o vencidos
      },
      include: [
        {
          model: Ejemplar,
          as: 'ejemplar',
          include: [
            {
              model: Libro,
              as: 'libro',
              include: [
                {
                  model: Autor,
                  as: 'autor'
                }
              ]
            }
          ]
        }
      ],
      order: [['FechaPrestamo', 'DESC']]
    });
    
    console.log(`Se encontraron ${prestamos.length} préstamos`);
    res.status(200).send(prestamos);
  } catch (err) {
    console.error("Error al obtener mis préstamos:", err);
    res.status(500).send({
      message: err.message || "Ocurrió un error al obtener los préstamos."
    });
  }
};

// Obtener un solo préstamo por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Prestamo.findByPk(id, {
      include: [
        {
          model: Ejemplar,
          as: 'ejemplar',
          include: [
            {
              model: Libro,
              as: 'libro',
              include: [
                {
                  model: Autor,
                  as: 'autor'
                }
              ]
            }
          ]
        }
      ]
    });

    if (data) {
      res.send(data);
    } else {
      res.status(404).send({
        message: `No se encontró el préstamo con ID=${id}.`
      });
    }
  } catch (err) {
    console.error("Error al obtener préstamo:", err);
    res.status(500).send({
      message: "Error al obtener el préstamo con ID=" + req.params.id
    });
  }
};

// Actualizar un préstamo por ID
exports.actualizar = async (req, res) => {
  try {
    const id = req.params.id;
    const num = await Prestamo.update(req.body, {
      where: { PrestamoID: id }
    });

    if (num == 1) {
      res.send({
        message: "El préstamo fue actualizado exitosamente."
      });
    } else {
      res.send({
        message: `No se pudo actualizar el préstamo con ID=${id}.`
      });
    }
  } catch (err) {
    console.error("Error al actualizar préstamo:", err);
    res.status(500).send({
      message: "Error al actualizar el préstamo con ID=" + req.params.id
    });
  }
};

// Registrar devolución
exports.registrarDevolucion = async (req, res) => {
  try {
    const id = req.params.id;
    const prestamo = await Prestamo.findByPk(id);
    
    if (!prestamo) {
      return res.status(404).send({
        message: `No se encontró el préstamo con ID=${id}.`
      });
    }
    
    if (prestamo.Estado === 'devuelto') {
      return res.status(400).send({
        message: "Este préstamo ya ha sido devuelto."
      });
    }
    
    // Actualizar el estado del préstamo
    await prestamo.update({
      Estado: 'devuelto',
      FechaDevolucionReal: new Date(),
      BibliotecarioDevolucionID: req.body.BibliotecarioID || req.userId,
      Notas: req.body.Notas || prestamo.Notas
    });
    
    // Actualizar el estado del ejemplar
    const ejemplar = await Ejemplar.findByPk(prestamo.EjemplarID);
    if (ejemplar) {
      await ejemplar.update({ 
        Estado: 'Disponible',
        Condicion: req.body.Condicion || ejemplar.Condicion 
      });
    }
    
    res.send({
      message: "El préstamo fue registrado como devuelto exitosamente."
    });
  } catch (err) {
    console.error("Error al registrar devolución:", err);
    res.status(500).send({
      message: "Error al registrar la devolución: " + err.message
    });
  }
};

// Eliminar un préstamo por ID
exports.eliminar = async (req, res) => {
  try {
    const id = req.params.id;
    const num = await Prestamo.destroy({
      where: { PrestamoID: id }
    });

    if (num == 1) {
      res.send({
        message: "El préstamo fue eliminado exitosamente."
      });
    } else {
      res.send({
        message: `No se pudo eliminar el préstamo con ID=${id}. Tal vez el préstamo no fue encontrado.`
      });
    }
  } catch (err) {
    console.error("Error al eliminar préstamo:", err);
    res.status(500).send({
      message: "No se pudo eliminar el préstamo con ID=" + req.params.id
    });
  }
};