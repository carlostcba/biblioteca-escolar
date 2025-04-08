// controllers/reserva.controller.js
const db = require('../models');
const Reserva = db.Reserva;
const Libro = db.Libro;
const Usuario = db.Usuario;
const Ejemplar = db.Ejemplar;
const Prestamo = db.Prestamo;
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
    const ahora = new Date();
    const fechaExpiracion = new Date(ahora);
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 48);

    // Crear objeto de reserva
    const reserva = {
      LibroID: req.body.LibroID,
      UsuarioID: req.userId,
      FechaReserva: ahora,
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
    console.error("Error en crear reserva:", err);
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
    const ahora = new Date();
    const fechaExpiracion = new Date(ahora);
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 48);

    // Crear objeto de reserva con ejemplar específico
    const reserva = {
      LibroID: libroID,
      UsuarioID: req.userId,
      EjemplarID: ejemplarID,
      FechaReserva: ahora,
      FechaExpiracion: fechaExpiracion,
      Estado: 'pendiente',
      Notas: req.body.Notas || null
    };

    // Guardar en la base de datos usando una transacción
    const result = await db.sequelize.transaction(async (t) => {
      // Crear la reserva
      const nuevaReserva = await Reserva.create(reserva, { transaction: t });
      
      // Actualizar el estado del ejemplar
      await db.sequelize.query(
        "UPDATE Ejemplares SET Estado = 'Reservado', FechaActualizacion = GETDATE() WHERE EjemplarID = :ejemplarID",
        {
          replacements: { ejemplarID },
          type: db.sequelize.QueryTypes.UPDATE,
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

    // Buscar el ejemplar por separado
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
          as: 'libro',
          include: [
            {
              model: db.Autor,
              as: 'autor'
            }
          ]
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
      if (req.userId === reserva.UsuarioID && estado === 'cancelada') {
        // Permitir
      } else {
        return res.status(403).send({
          message: "No tienes permiso para modificar esta reserva"
        });
      }
    }
    
    // Determinar el ejemplar a usar
    const ejemplarParaPrestamo = ejemplarID || reserva.EjemplarID;
    
    // Usar una transacción para asegurar la consistencia
    await db.sequelize.transaction(async (t) => {
      // Actualizar estado
      await db.sequelize.query(
        "UPDATE Reservas SET Estado = :estado, FechaActualizacion = GETDATE() " + 
        (notas ? ", Notas = :notas " : "") +
        (ejemplarID ? ", EjemplarID = :ejemplarID " : "") +
        "WHERE ReservaID = :id",
        {
          replacements: { 
            estado, 
            notas: notas || null, 
            ejemplarID: ejemplarID || null, 
            id 
          },
          type: db.sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      
      // Si se proporciona un ejemplar, verificar y actualizar
      if (ejemplarID && (estado === 'lista' || estado === 'completada')) {
        // Verificar si el ejemplar existe
        const ejemplar = await Ejemplar.findByPk(ejemplarID, { transaction: t });
        
        if (!ejemplar) {
          throw new Error("El ejemplar especificado no existe");
        }
        
        if (ejemplar.Estado !== 'Disponible' && ejemplar.LibroID !== reserva.LibroID) {
          throw new Error("El ejemplar no está disponible o no corresponde al libro de la reserva");
        }
        
        // Si el estado es "lista", actualizar estado del ejemplar a "Reservado"
        if (estado === 'lista') {
          await db.sequelize.query(
            "UPDATE Ejemplares SET Estado = 'Reservado', FechaActualizacion = GETDATE() WHERE EjemplarID = :ejemplarID",
            {
              replacements: { ejemplarID },
              type: db.sequelize.QueryTypes.UPDATE,
              transaction: t
            }
          );
        }
      }
      
      // Si el estado es "completada", crear el préstamo
      if (estado === 'completada' && ejemplarParaPrestamo) {
        console.log(`[DEBUG] Creando préstamo para reserva #${id} con ejemplar #${ejemplarParaPrestamo}`);
        
        // Verificar si ya existe un préstamo
        const prestamoExistente = await db.sequelize.query(
          `SELECT PrestamoID FROM Prestamos 
           WHERE EjemplarID = :ejemplarID 
           AND UsuarioID = :usuarioID 
           AND Estado = 'Activo'`,
          {
            replacements: { 
              ejemplarID: ejemplarParaPrestamo,
              usuarioID: reserva.UsuarioID 
            },
            type: db.sequelize.QueryTypes.SELECT,
            transaction: t
          }
        );
        
        if (prestamoExistente.length === 0) {
          let diasPrestamo = 14; // Valor por defecto
          
          // Calcular fecha de devolución
          const fechaDevolucion = new Date();
          fechaDevolucion.setDate(fechaDevolucion.getDate() + diasPrestamo);
          
          // Crear préstamo con consulta directa
          await db.sequelize.query(
            `INSERT INTO Prestamos (
              EjemplarID, UsuarioID, FechaPrestamo, FechaDevolucion, 
              Estado, Renovaciones, Notas, MultaImporte, MultaPagada, 
              BibliotecarioID, FechaCreacion, FechaActualizacion
            ) VALUES (
              :ejemplarID, :usuarioID, GETDATE(), :fechaDevolucion,
              'Activo', 0, :notas, 0, 0, 
              :bibliotecarioID, GETDATE(), GETDATE()
            )`,
            {
              replacements: {
                ejemplarID: ejemplarParaPrestamo,
                usuarioID: reserva.UsuarioID,
                fechaDevolucion: fechaDevolucion.toISOString().slice(0, 19).replace('T', ' '),
                notas: `Creado a partir de reserva #${id}`,
                bibliotecarioID: req.userId || 1
              },
              type: db.sequelize.QueryTypes.INSERT,
              transaction: t
            }
          );
          
          // Actualizar el estado del ejemplar a Prestado
          await db.sequelize.query(
            "UPDATE Ejemplares SET Estado = 'Prestado', FechaActualizacion = GETDATE() WHERE EjemplarID = :ejemplarID",
            {
              replacements: { ejemplarID: ejemplarParaPrestamo },
              type: db.sequelize.QueryTypes.UPDATE,
              transaction: t
            }
          );
          
          // Agregar nota a la reserva
          await db.sequelize.query(
            `UPDATE Reservas 
             SET Notas = CASE 
                          WHEN Notas IS NULL OR Notas = '' THEN 'Convertida a préstamo' 
                          ELSE Notas + ' | Convertida a préstamo' 
                        END
             WHERE ReservaID = :id`,
            {
              replacements: { id },
              type: db.sequelize.QueryTypes.UPDATE,
              transaction: t
            }
          );
          
          console.log(`[DEBUG] Préstamo creado exitosamente para la reserva #${id}`);
        } else {
          console.log(`[DEBUG] Ya existe un préstamo para el ejemplar #${ejemplarParaPrestamo}`);
        }
      }
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
    
    // Si el estado es completada, buscar y adjuntar el préstamo generado
    if (estado === 'completada' && ejemplarParaPrestamo) {
      try {
        const prestamo = await db.sequelize.query(
          `SELECT * FROM Prestamos 
           WHERE EjemplarID = :ejemplarID 
           AND UsuarioID = :usuarioID 
           AND Notas LIKE :notasBusqueda
           ORDER BY FechaCreacion DESC`,
          {
            replacements: { 
              ejemplarID: ejemplarParaPrestamo,
              usuarioID: reserva.UsuarioID,
              notasBusqueda: `%reserva #${id}%`
            },
            type: db.sequelize.QueryTypes.SELECT
          }
        );
        
        if (prestamo && prestamo.length > 0) {
          respuesta.prestamo = prestamo[0];
        }
      } catch (prestamoError) {
        console.error("Error al buscar el préstamo generado:", prestamoError);
      }
    }
    
    res.send(respuesta);
  } catch (err) {
    console.error("Error en cambiarEstado:", err);
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
    
    // Usar una transacción para asegurar la consistencia
    await db.sequelize.transaction(async (t) => {
      // Actualizar estado a cancelada
      await db.sequelize.query(
        "UPDATE Reservas SET Estado = 'cancelada', FechaActualizacion = GETDATE() WHERE ReservaID = :id",
        {
          replacements: { id },
          type: db.sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      
      // Si hay un ejemplar asignado, liberarlo
      if (reserva.EjemplarID) {
        await db.sequelize.query(
          "UPDATE Ejemplares SET Estado = 'Disponible', FechaActualizacion = GETDATE() WHERE EjemplarID = :ejemplarID",
          {
            replacements: { ejemplarID: reserva.EjemplarID },
            type: db.sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
      }
    });
    
    res.send({
      message: "La reserva ha sido cancelada exitosamente"
    });
  } catch (err) {
    res.status(500).send({
      message: "Error al cancelar la reserva con ID=" + id
    });
  }
};

// Convertir reserva a préstamo (función específica)
/*
exports.convertirAPrestamo = async (req, res) => {
  try {
    const id = req.params.id;
    const { diasPrestamo = 14 } = req.body;
    
    // Verificar que el usuario sea bibliotecario o administrador
    if (req.userRole !== 'administrador' && req.userRole !== 'bibliotecario') {
      return res.status(403).send({
        message: "No tienes permiso para realizar esta acción"
      });
    }
    
    // Buscar la reserva
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
    
    // Verificar que la reserva esté en estado "lista"
    if (reserva.Estado !== 'lista') {
      return res.status(400).send({
        message: "Solo se pueden convertir a préstamo las reservas en estado 'lista'"
      });
    }
    
    // Verificar que tenga un ejemplar asignado
    if (!reserva.EjemplarID) {
      return res.status(400).send({
        message: "La reserva no tiene un ejemplar asignado"
      });
    }
    
    // Verificar si ya existe un préstamo activo
    const prestamoExistente = await db.sequelize.query(
      `SELECT PrestamoID FROM Prestamos 
       WHERE EjemplarID = :ejemplarID AND UsuarioID = :usuarioID AND Estado = 'Activo'`,
      {
        replacements: { 
          ejemplarID: reserva.EjemplarID,
          usuarioID: reserva.UsuarioID
        },
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    if (prestamoExistente.length > 0) {
      return res.status(400).send({
        message: "Ya existe un préstamo activo para este ejemplar y usuario"
      });
    }
    
    // Usar una transacción para asegurar la consistencia
    const result = await db.sequelize.transaction(async (t) => {
      // Calcular fecha de devolución
      const fechaDevolucion = new Date();
      fechaDevolucion.setDate(fechaDevolucion.getDate() + parseInt(diasPrestamo));
      
      // Crear el préstamo
      const [prestamoInsertResult] = await db.sequelize.query(
        `INSERT INTO Prestamos (
          EjemplarID, UsuarioID, FechaPrestamo, FechaDevolucion, 
          Estado, Renovaciones, BibliotecarioID, Notas, MultaImporte, MultaPagada,
          FechaCreacion, FechaActualizacion
        ) OUTPUT INSERTED.PrestamoID
        VALUES (
          :ejemplarID, :usuarioID, GETDATE(), :fechaDevolucion,
          'Activo', 0, :bibliotecarioID, :notasPrestamo, 0, 0, 
          GETDATE(), GETDATE()
        )`,
        {
          replacements: { 
            ejemplarID: reserva.EjemplarID,
            usuarioID: reserva.UsuarioID,
            fechaDevolucion: fechaDevolucion.toISOString().slice(0, 19).replace('T', ' '),
            bibliotecarioID: req.userId,
            notasPrestamo: `Generado a partir de la reserva #${id}`
          },
          type: db.sequelize.QueryTypes.INSERT,
          transaction: t
        }
      );
      
      // Obtener el ID del préstamo insertado
      const prestamoID = prestamoInsertResult.length > 0 ? prestamoInsertResult[0].PrestamoID : null;
      
      if (!prestamoID) {
        throw new Error("Error al crear el préstamo - No se pudo obtener el ID");
      }
      
      // Actualizar la reserva a "completada"
      await db.sequelize.query(
        "UPDATE Reservas SET Estado = 'completada', FechaActualizacion = GETDATE() WHERE ReservaID = :id",
        {
          replacements: { id },
          type: db.sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      
      // Actualizar el estado del ejemplar a "Prestado"
      await db.sequelize.query(
        "UPDATE Ejemplares SET Estado = 'Prestado', FechaActualizacion = GETDATE() WHERE EjemplarID = :ejemplarID",
        {
          replacements: { ejemplarID: reserva.EjemplarID },
          type: db.sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      
      return { prestamoID };
    });
    
    // Obtener el préstamo creado
    const prestamo = await db.sequelize.query(
      "SELECT * FROM Prestamos WHERE PrestamoID = :prestamoID",
      {
        replacements: { prestamoID: result.prestamoID },
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    res.status(200).send({
      message: "Reserva convertida a préstamo exitosamente",
      prestamo: prestamo.length > 0 ? prestamo[0] : null,
      reservaID: id
    });
  } catch (err) {
    console.error("Error en convertirAPrestamo:", err);
    res.status(500).send({
      message: err.message || "Error al convertir la reserva a préstamo."
    });
  }
};
*/

// Verificar reservas vencidas (para tareas programadas)
exports.verificarReservasVencidas = async () => {
  try {
    console.log("Iniciando verificación de reservas vencidas...");
    const ahora = new Date();
    
    // Buscar reservas pendientes o listas que ya expiraron
    const reservasVencidas = await Reserva.findAll({
      where: {
        Estado: {
          [Op.in]: ['pendiente', 'lista']
        },
        FechaExpiracion: {
          [Op.lt]: ahora
        }
      }
    });
    
    console.log(`Se encontraron ${reservasVencidas.length} reservas vencidas.`);
    
    if (reservasVencidas.length === 0) {
      return {
        message: "No hay reservas vencidas para procesar",
        count: 0
      };
    }
    
    // Procesar cada reserva vencida
    let procesadas = 0;
    
    for (const reserva of reservasVencidas) {
      try {
        await db.sequelize.transaction(async (t) => {
          // Actualizar estado de la reserva a vencida
          await db.sequelize.query(
            "UPDATE Reservas SET Estado = 'vencida', FechaActualizacion = GETDATE() WHERE ReservaID = :id",
            {
              replacements: { id: reserva.ReservaID },
              type: db.sequelize.QueryTypes.UPDATE,
              transaction: t
            }
          );
          
          // Si hay un ejemplar asignado, liberarlo
          if (reserva.EjemplarID) {
            await db.sequelize.query(
              "UPDATE Ejemplares SET Estado = 'Disponible', FechaActualizacion = GETDATE() WHERE EjemplarID = :ejemplarID",
              {
                replacements: { ejemplarID: reserva.EjemplarID },
                type: db.sequelize.QueryTypes.UPDATE,
                transaction: t
              }
            );
          }
        });
        
        procesadas++;
      } catch (error) {
        console.error(`Error al procesar reserva vencida #${reserva.ReservaID}:`, error);
      }
    }
    
    return {
      message: `Se han procesado ${procesadas} reservas vencidas`,
      count: procesadas
    };
  } catch (err) {
    console.error("Error en verificarReservasVencidas:", err);
    throw err;
  }
};

// Estadísticas de reservas
exports.obtenerEstadisticas = async (req, res) => {
  try {
    // Verificar que el usuario sea bibliotecario o administrador
    if (req.userRole !== 'administrador' && req.userRole !== 'bibliotecario') {
      return res.status(403).send({
        message: "No tienes permiso para acceder a estas estadísticas"
      });
    }
    
    // Estadísticas por estado
    const estadoPorEstado = await db.sequelize.query(
      `SELECT Estado, COUNT(*) as total 
       FROM Reservas 
       GROUP BY Estado`,
      {
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    // Total de reservas por mes (últimos 6 meses)
    const reservasPorMes = await db.sequelize.query(
      `SELECT DATEPART(YEAR, FechaReserva) as año,
              DATEPART(MONTH, FechaReserva) as mes,
              COUNT(*) as total
       FROM Reservas
       WHERE FechaReserva >= DATEADD(MONTH, -6, GETDATE())
       GROUP BY DATEPART(YEAR, FechaReserva), DATEPART(MONTH, FechaReserva)
       ORDER BY año, mes`,
      {
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    // Tasa de conversión (reservas completadas vs canceladas o vencidas)
    const tasaConversion = await db.sequelize.query(
      `SELECT 
         SUM(CASE WHEN Estado = 'completada' THEN 1 ELSE 0 END) as completadas,
         SUM(CASE WHEN Estado IN ('cancelada', 'vencida') THEN 1 ELSE 0 END) as no_completadas,
         SUM(CASE WHEN Estado = 'completada' THEN 1 ELSE 0 END) * 100.0 / 
            NULLIF(COUNT(*), 0) as tasa_conversion
       FROM Reservas
       WHERE Estado IN ('completada', 'cancelada', 'vencida')`,
      {
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    // Tiempo promedio entre reserva y préstamo
    const tiempoPromedio = await db.sequelize.query(
      `SELECT AVG(DATEDIFF(HOUR, r.FechaReserva, p.FechaPrestamo)) as horas_promedio
       FROM Reservas r
       JOIN Prestamos p ON p.EjemplarID = r.EjemplarID AND p.UsuarioID = r.UsuarioID
       WHERE r.Estado = 'completada'
       AND p.Notas LIKE '%reserva%'`,
      {
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    // Libros más reservados
    const librosPopulares = await db.sequelize.query(
      `SELECT TOP 10
         l.LibroID, l.Titulo,
         COUNT(r.ReservaID) as total_reservas
       FROM Reservas r
       JOIN Libros l ON r.LibroID = l.LibroID
       GROUP BY l.LibroID, l.Titulo
       ORDER BY total_reservas DESC`,
      {
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    res.send({
      porEstado: estadoPorEstado,
      porMes: reservasPorMes,
      tasaConversion: tasaConversion[0] || { completadas: 0, no_completadas: 0, tasa_conversion: 0 },
      tiempoPromedio: tiempoPromedio[0] || { horas_promedio: 0 },
      librosPopulares: librosPopulares
    });
  } catch (err) {
    console.error("Error en obtenerEstadisticas:", err);
    res.status(500).send({
      message: err.message || "Error al obtener las estadísticas de reservas."
    });
  }
};

// Procesar reservas completadas en lote
exports.convertirReservasCompletadasABulkPrestamos = async (req, res) => {
  try {
    if (req.userRole !== 'administrador' && req.userRole !== 'bibliotecario') {
      return res.status(403).send({ message: "No tienes permiso para esta acción" });
    }

    const result = await db.sequelize.query(`
      DECLARE @BibliotecarioID INT = :bibliotecarioID;
      DECLARE @DiasPrestamo INT = 14;

      DECLARE @ReservasAProcesar TABLE (
          ReservaID INT,
          EjemplarID INT,
          UsuarioID INT
      );

      INSERT INTO @ReservasAProcesar (ReservaID, EjemplarID, UsuarioID)
      SELECT ReservaID, EjemplarID, UsuarioID
      FROM Reservas
      WHERE Estado = 'completada'
        AND (Notas IS NULL OR Notas NOT LIKE '%Convertida a préstamo%')
        AND NOT EXISTS (
            SELECT 1 
            FROM Prestamos p
            WHERE p.EjemplarID = Reservas.EjemplarID
              AND p.UsuarioID = Reservas.UsuarioID
              AND p.Notas LIKE '%reserva #' + CAST(Reservas.ReservaID AS NVARCHAR(10)) + '%'
        );

      INSERT INTO Prestamos (
          EjemplarID, 
          UsuarioID, 
          FechaPrestamo, 
          FechaDevolucion, 
          Estado,
          Renovaciones,
          BibliotecarioID,
          Notas,
          FechaCreacion,
          FechaActualizacion
      )
      SELECT 
          r.EjemplarID,
          r.UsuarioID,
          GETDATE(),
          DATEADD(DAY, @DiasPrestamo, GETDATE()),
          'activo',
          0,
          @BibliotecarioID,
          'Creado a partir de reserva #' + CAST(r.ReservaID AS NVARCHAR(10)),
          GETDATE(),
          GETDATE()
      FROM @ReservasAProcesar r;

      UPDATE e
      SET e.Estado = 'Prestado',
          e.FechaActualizacion = GETDATE()
      FROM Ejemplares e
      JOIN @ReservasAProcesar r ON e.EjemplarID = r.EjemplarID
      WHERE e.Estado != 'Prestado';

      UPDATE r
      SET r.FechaActualizacion = GETDATE(),
          r.Notas = ISNULL(r.Notas, '') + 
                    CASE WHEN r.Notas IS NULL OR LEN(r.Notas) = 0 THEN '' ELSE ' | ' END +
                    'Convertida a préstamo'
      FROM Reservas r
      JOIN @ReservasAProcesar p ON r.ReservaID = p.ReservaID;

      SELECT r.ReservaID, 'Convertida a préstamo' AS Accion FROM @ReservasAProcesar r;
    `, {
      replacements: { bibliotecarioID: req.userId || 1 },
      type: db.sequelize.QueryTypes.SELECT
    });

    res.status(200).send({
      message: "Reservas completadas procesadas exitosamente",
      resultados: result
    });
  } catch (err) {
    console.error("Error al convertir reservas completadas:", err);
    res.status(500).send({ message: "Error al convertir reservas completadas", error: err.message });
  }
};

module.exports = exports;