// controllers/reserva.controller.js
const db = require('../models');
const Reserva = db.Reserva;
const Libro = db.Libro;
const Usuario = db.Usuario;
const Ejemplar = db.Ejemplar;
const Op = db.Sequelize.Op;

// Crear una nueva reserva
exports.crear = async (req, res) => {
  try {
    // Validar solicitud
    if (!req.body.LibroID) {
      return res.status(400).send({
        message: "El ID del libro es obligatorio"
      });
    }

    // Verificar disponibilidad del libro
    const libro = await Libro.findByPk(req.body.LibroID, {
      include: [{
        model: Ejemplar,
        as: 'ejemplares',
        where: { Estado: 'Disponible' }
      }]
    });

    if (!libro || libro.ejemplares.length === 0) {
      return res.status(400).send({
        message: "No hay ejemplares disponibles para este libro"
      });
    }

    // Verificar si el usuario ya tiene una reserva activa para este libro
    const reservaExistente = await Reserva.findOne({
      where: {
        LibroID: req.body.LibroID,
        UsuarioID: req.userId,
        Estado: {
          [Op.in]: ['pendiente', 'lista']
        }
      }
    });

    if (reservaExistente) {
      return res.status(400).send({
        message: "Ya tienes una reserva activa para este libro"
      });
    }

    // Calcular fecha de expiración (48 horas desde ahora)
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 48);

    // Crear objeto de reserva
    const reserva = {
      LibroID: req.body.LibroID,
      UsuarioID: req.userId,
      FechaReserva: new Date(),
      FechaExpiracion: fechaExpiracion,
      Estado: 'pendiente',
      Notas: req.body.Notas || null
    };

    // Guardar en la base de datos
    const nuevaReserva = await Reserva.create(reserva);

    // Obtener detalles completos de la reserva creada
    const reservaCompleta = await Reserva.findByPk(nuevaReserva.ReservaID, {
      include: [
        {
          model: Libro,
          as: 'libro'
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido', 'email', 'tipo_usuario']
        }
      ]
    });

    res.status(201).send(reservaCompleta);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al crear la reserva."
    });
  }
};

// Reservar un ejemplar específico
exports.reservarEjemplar = async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body); // Log para depuración
    
    // Validar solicitud
    if (!req.body.LibroID || !req.body.EjemplarID) {
      return res.status(400).send({
        message: "El ID del libro y el ID del ejemplar son obligatorios"
      });
    }

    // Asegurar que los IDs sean números enteros
    const libroID = parseInt(req.body.LibroID);
    const ejemplarID = parseInt(req.body.EjemplarID);
    
    if (isNaN(libroID) || isNaN(ejemplarID)) {
      return res.status(400).send({
        message: "El ID del libro y el ID del ejemplar deben ser números válidos"
      });
    }

    // Verificar que el ejemplar exista y pertenezca al libro
    const ejemplar = await Ejemplar.findOne({
      where: {
        EjemplarID: ejemplarID,
        LibroID: libroID,
        Estado: 'Disponible'
      }
    });

    if (!ejemplar) {
      return res.status(400).send({
        message: "El ejemplar no está disponible o no corresponde al libro especificado"
      });
    }

    // Verificar si el usuario ya tiene una reserva activa para este libro
    const reservaExistente = await Reserva.findOne({
      where: {
        LibroID: libroID,
        UsuarioID: req.userId,
        Estado: {
          [Op.in]: ['pendiente', 'lista']
        }
      }
    });

    if (reservaExistente) {
      return res.status(400).send({
        message: "Ya tienes una reserva activa para este libro"
      });
    }

    // Calcular fecha de expiración (48 horas desde ahora)
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 48);

    // Crear objeto de reserva con ejemplar específico
    const reserva = {
      LibroID: libroID,
      UsuarioID: req.userId,
      EjemplarID: ejemplarID,
      FechaReserva: new Date(),
      FechaExpiracion: fechaExpiracion,
      Estado: 'pendiente',
      Notas: req.body.Notas || null
    };

    // Guardar en la base de datos usando una transacción
    const result = await db.sequelize.transaction(async (t) => {
      // Crear la reserva
      const nuevaReserva = await Reserva.create(reserva, { transaction: t });
      
      // Actualizar el estado del ejemplar
      await Ejemplar.update(
        { Estado: 'Reservado' },
        { 
          where: { EjemplarID: ejemplarID },
          transaction: t
        }
      );
      
      return nuevaReserva;
    });

    // Obtener detalles completos de la reserva creada
    const reservaCompleta = await Reserva.findByPk(result.ReservaID, {
      include: [
        {
          model: Libro,
          as: 'libro'
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido', 'email', 'tipo_usuario']
        }
      ]
    });

    // Buscar el ejemplar por separado si la asociación no está bien configurada
    const ejemplarCompleto = await Ejemplar.findByPk(ejemplarID);
    
    // Agregar manualmente el ejemplar a la respuesta
    const respuesta = reservaCompleta.toJSON();
    respuesta.ejemplar = ejemplarCompleto;

    res.status(201).send(respuesta);
  } catch (err) {
    console.error("Error en reservarEjemplar:", err);
    res.status(500).send({
      message: err.message || "Ocurrió un error al crear la reserva del ejemplar."
    });
  }
};

// Obtener todas las reservas (para administradores y bibliotecarios)
exports.obtenerTodas = async (req, res) => {
  try {
    const { 
      usuario, 
      estado, 
      fechaDesde, 
      fechaHasta, 
      pagina = 1, 
      limite = 10, 
      tab = 'pendientes' 
    } = req.query;
    
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    let condicion = {};
    
    // Filtrar por tab seleccionada
    if (tab === 'pendientes') {
      condicion.Estado = 'pendiente';
    } else if (tab === 'listas') {
      condicion.Estado = 'lista';
    } else if (tab === 'historial') {
      condicion.Estado = {
        [Op.in]: ['completada', 'cancelada', 'vencida']
      };
    }
    
    // Aplicar filtros adicionales
    if (usuario) {
      condicion['$usuario.nombre$'] = { [Op.like]: `%${usuario}%` };
    }
    
    if (estado) {
      condicion.Estado = estado;
    }
    
    if (fechaDesde) {
      condicion.FechaReserva = { 
        ...condicion.FechaReserva,
        [Op.gte]: new Date(fechaDesde) 
      };
    }
    
    if (fechaHasta) {
      const fechaFinalizacion = new Date(fechaHasta);
      fechaFinalizacion.setHours(23, 59, 59, 999);
      
      condicion.FechaReserva = { 
        ...condicion.FechaReserva,
        [Op.lte]: fechaFinalizacion
      };
    }
    
    const { count, rows } = await Reserva.findAndCountAll({
      where: condicion,
      include: [
        {
          model: Libro,
          as: 'libro'
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido', 'email', 'tipo_usuario']
        }
      ],
      limit: parseInt(limite),
      offset: offset,
      order: [['FechaReserva', 'DESC']]
    });
    
    // Obtener ejemplares asociados por separado
    const reservas = await Promise.all(rows.map(async (reserva) => {
      const ejemplar = reserva.EjemplarID ? 
        await Ejemplar.findByPk(reserva.EjemplarID) : null;
      
      const reservaJSON = reserva.toJSON();
      reservaJSON.ejemplar = ejemplar;
      return reservaJSON;
    }));
    
    res.send({
      totalItems: count,
      reservas: reservas,
      totalPaginas: Math.ceil(count / parseInt(limite)),
      paginaActual: parseInt(pagina)
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al obtener las reservas."
    });
  }
};

// Obtener reservas del usuario actual
exports.obtenerMisReservas = async (req, res) => {
  try {
    const { tab = 'activas' } = req.query;
    
    let condicion = {
      UsuarioID: req.userId
    };
    
    if (tab === 'activas') {
      condicion.Estado = {
        [Op.in]: ['pendiente', 'lista']
      };
    } else if (tab === 'historial') {
      condicion.Estado = {
        [Op.in]: ['completada', 'cancelada', 'vencida']
      };
    }
    
    const reservas = await Reserva.findAll({
      where: condicion,
      include: [
        {
          model: Libro,
          as: 'libro'
        }
      ],
      order: [['FechaReserva', 'DESC']]
    });
    
    // Obtener ejemplares asociados por separado
    const reservasConEjemplares = await Promise.all(reservas.map(async (reserva) => {
      const ejemplar = reserva.EjemplarID ? 
        await Ejemplar.findByPk(reserva.EjemplarID) : null;
      
      const reservaJSON = reserva.toJSON();
      reservaJSON.ejemplar = ejemplar;
      return reservaJSON;
    }));
    
    res.send(reservasConEjemplares);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al obtener tus reservas."
    });
  }
};

// Obtener una reserva por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const id = req.params.id;
    
    const reserva = await Reserva.findByPk(id, {
      include: [
        {
          model: Libro,
          as: 'libro'
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido', 'email', 'tipo_usuario']
        }
      ]
    });
    
    if (!reserva) {
      return res.status(404).send({
        message: `No se encontró la reserva con ID=${id}.`
      });
    }
    
    // Verificar si el usuario tiene permiso para ver esta reserva
    if (req.userId !== reserva.UsuarioID && 
        req.userRole !== 'administrador' && 
        req.userRole !== 'bibliotecario') {
      return res.status(403).send({
        message: "No tienes permiso para ver esta reserva"
      });
    }
    
    // Obtener el ejemplar asociado por separado
    const ejemplar = reserva.EjemplarID ? 
      await Ejemplar.findByPk(reserva.EjemplarID) : null;
    
    const respuesta = reserva.toJSON();
    respuesta.ejemplar = ejemplar;
    
    res.send(respuesta);
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener la reserva con ID=" + req.params.id
    });
  }
};

// Cambiar estado de reserva
exports.cambiarEstado = async (req, res) => {
  try {
    const id = req.params.id;
    const { estado, ejemplarID, notas } = req.body;
    
    // Validar el nuevo estado
    const estadosValidos = ['pendiente', 'lista', 'completada', 'cancelada', 'vencida'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).send({
        message: "Estado de reserva no válido"
      });
    }
    
    // Obtener la reserva actual
    const reserva = await Reserva.findByPk(id, {
      include: [
        {
          model: Libro,
          as: 'libro'
        },
        {
          model: Usuario,
          as: 'usuario'
        }
      ]
    });
    
    if (!reserva) {
      return res.status(404).send({
        message: `No se encontró la reserva con ID=${id}.`
      });
    }
    
    // Verificar permisos
    if (req.userId !== reserva.UsuarioID && 
        req.userRole !== 'administrador' && 
        req.userRole !== 'bibliotecario') {
      
      // Los usuarios solo pueden cancelar sus propias reservas
      if (req.userId === reserva.UsuarioID && estado === 'cancelada') {// Permitir
      } else {
        return res.status(403).send({
          message: "No tienes permiso para modificar esta reserva"
        });
      }
    }
    
    // Actualizar estado
    const actualizacion = {
      Estado: estado
    };
    
    // Si se proporciona un ejemplar, asignarlo
    if (ejemplarID && (estado === 'lista' || estado === 'completada')) {
      // Verificar si el ejemplar existe y está disponible
      const ejemplar = await Ejemplar.findByPk(ejemplarID);
      
      if (!ejemplar) {
        return res.status(404).send({
          message: "El ejemplar especificado no existe"
        });
      }
      
      if (ejemplar.Estado !== 'Disponible' && ejemplar.LibroID !== reserva.LibroID) {
        return res.status(400).send({
          message: "El ejemplar no está disponible o no corresponde al libro de la reserva"
        });
      }
      
      actualizacion.EjemplarID = ejemplarID;
      
      // Si el estado es "completada", actualizar también el estado del ejemplar
      if (estado === 'completada') {
        await Ejemplar.update(
          { Estado: 'Prestado' },
          { where: { EjemplarID: ejemplarID } }
        );
        
        // Aquí podríamos crear un préstamo automáticamente
        // Pero eso lo dejaremos para la implementación del controlador de préstamos
      }
    }
    
    // Actualizar notas si se proporcionan
    if (notas) {
      actualizacion.Notas = notas;
    }
    
    // Actualizar en la base de datos
    await Reserva.update(actualizacion, {
      where: { ReservaID: id }
    });
    
    // Obtener la reserva actualizada
    const reservaActualizada = await Reserva.findByPk(id, {
      include: [
        {
          model: Libro,
          as: 'libro'
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'apellido', 'email', 'tipo_usuario']
        }
      ]
    });
    
    // Obtener el ejemplar asociado por separado
    const ejemplarActualizado = reservaActualizada.EjemplarID ? 
      await Ejemplar.findByPk(reservaActualizada.EjemplarID) : null;
    
    const respuesta = reservaActualizada.toJSON();
    respuesta.ejemplar = ejemplarActualizado;
    
    res.send(respuesta);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error al cambiar el estado de la reserva."
    });
  }
};

// Cancelar una reserva
exports.cancelar = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Obtener la reserva actual
    const reserva = await Reserva.findByPk(id);
    
    if (!reserva) {
      return res.status(404).send({
        message: `No se encontró la reserva con ID=${id}.`
      });
    }
    
    // Verificar si el usuario tiene permiso para cancelar esta reserva
    if (req.userId !== reserva.UsuarioID && 
        req.userRole !== 'administrador' && 
        req.userRole !== 'bibliotecario') {
      return res.status(403).send({
        message: "No tienes permiso para cancelar esta reserva"
      });
    }
    
    // Verificar si la reserva ya está completada o cancelada
    if (reserva.Estado === 'completada' || reserva.Estado === 'cancelada' || reserva.Estado === 'vencida') {
      return res.status(400).send({
        message: `No se puede cancelar una reserva en estado ${reserva.Estado}`
      });
    }
    
    // Actualizar estado a cancelada
    await Reserva.update(
      { Estado: 'cancelada' },
      { where: { ReservaID: id } }
    );
    
    // Si hay un ejemplar asignado, liberarlo
    if (reserva.EjemplarID) {
      await Ejemplar.update(
        { Estado: 'Disponible' },
        { where: { EjemplarID: reserva.EjemplarID } }
      );
    }
    
    res.send({
      message: "La reserva ha sido cancelada exitosamente"
    });
  } catch (err) {
    res.status(500).send({
      message: "Error al cancelar la reserva con ID=" + id
    });
  }
};