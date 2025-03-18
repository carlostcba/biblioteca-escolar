// controllers/usuario.controller.js
const db = require('../models');
const Usuario = db.Usuario;
const PerfilEscolar = db.PerfilEscolar;
const Op = db.Sequelize.Op;

// Crear un nuevo usuario
exports.crear = async (req, res) => {
  try {
    // Implementar lógica de creación
    // Nota: Normalmente esto se haría a través del controlador de autenticación
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al crear el usuario."
    });
  }
};

// Obtener todos los usuarios
exports.obtenerTodos = async (req, res) => {
  try {
    const { page = 1, size = 10, search = '', estado = '', tipo = '' } = req.query;
    const limit = parseInt(size);
    const offset = (parseInt(page) - 1) * limit;
    
    let condicion = {};
    
    // Aplicar filtros
    if (search) {
      condicion = {
        [Op.or]: [
          { nombre: { [Op.like]: `%${search}%` } },
          { apellido: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      };
    }
    
    if (estado) {
      condicion.estado = estado;
    }
    
    if (tipo) {
      condicion.tipo_usuario = tipo;
    }
    
    const { count, rows } = await Usuario.findAndCountAll({
      where: condicion,
      limit,
      offset,
      include: [{
        model: PerfilEscolar,
        as: 'perfil'
      }],
      order: [['fecha_creacion', 'DESC']]
    });
    
    res.send({
      usuarios: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al obtener los usuarios."
    });
  }
};

// Obtener un solo usuario por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const id = req.params.id;
    const usuario = await Usuario.findByPk(id, {
      include: [{
        model: PerfilEscolar,
        as: 'perfil'
      }]
    });
    
    if (!usuario) {
      return res.status(404).send({
        message: `No se encontró el usuario con ID=${id}.`
      });
    }
    
    res.send(usuario);
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener el usuario con ID=" + req.params.id
    });
  }
};

// Obtener el perfil del usuario autenticado
exports.obtenerMiPerfil = async (req, res) => {
  try {
    const userId = req.userId; // Este valor viene del middleware de autenticación
    
    if (!userId) {
      return res.status(401).send({
        message: "No autenticado. Por favor inicie sesión."
      });
    }
    
    const usuario = await Usuario.findByPk(userId, {
      include: [{
        model: PerfilEscolar,
        as: 'perfil'
      }]
    });
    
    if (!usuario) {
      return res.status(404).send({
        message: "Usuario no encontrado."
      });
    }
    
    res.status(200).send({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario,
      perfil: usuario.perfil || null
    });
    
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).send({
      message: "Error al cargar datos del perfil"
    });
  }
};

// Aprobar un usuario
exports.aprobarUsuario = async (req, res) => {
  try {
    const id = req.params.id;
    const adminId = req.userId; // ID del administrador que está aprobando
    
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).send({
        message: "Usuario no encontrado"
      });
    }
    
    if (usuario.estado === 'activo') {
      return res.status(400).send({
        message: "El usuario ya está aprobado"
      });
    }
    
    // Actualizar el estado del usuario
    await usuario.update({
      estado: 'activo',
      aprobado_por: adminId,
      fecha_aprobacion: new Date()
    });
    
    // Aquí podrías implementar el envío de una notificación al usuario
    
    res.send({
      message: "Usuario aprobado exitosamente"
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error al aprobar el usuario"
    });
  }
};

// Cambiar estado de un usuario (activar/desactivar/suspender)
exports.cambiarEstado = async (req, res) => {
  try {
    const id = req.params.id;
    const { estado } = req.body;
    
    if (!['activo', 'inactivo', 'suspendido'].includes(estado)) {
      return res.status(400).send({
        message: "Estado inválido. Debe ser 'activo', 'inactivo' o 'suspendido'"
      });
    }
    
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).send({
        message: "Usuario no encontrado"
      });
    }
    
    // Actualizar el estado del usuario
    await usuario.update({ estado });
    
    res.send({
      message: `Estado del usuario cambiado a '${estado}' exitosamente`
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error al cambiar el estado del usuario"
    });
  }
};

// Actualizar un usuario
exports.actualizar = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Excluir campos sensibles o que no deben modificarse directamente
    const { password, estado, aprobado_por, fecha_aprobacion, ...datosActualizables } = req.body;
    
    const resultado = await Usuario.update(datosActualizables, {
      where: { id: id }
    });
    
    if (resultado[0] === 1) {
      res.send({
        message: "Usuario actualizado exitosamente."
      });
    } else {
      res.send({
        message: `No se pudo actualizar el usuario con ID=${id}. El usuario no existe o no se enviaron datos para actualizar.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al actualizar el usuario con ID=" + id
    });
  }
};

// Eliminar un usuario
exports.eliminar = async (req, res) => {
  try {
    const id = req.params.id;
    
    const resultado = await Usuario.destroy({
      where: { id: id }
    });
    
    if (resultado === 1) {
      res.send({
        message: "Usuario eliminado exitosamente."
      });
    } else {
      res.send({
        message: `No se pudo eliminar el usuario con ID=${id}. El usuario no existe.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al eliminar el usuario con ID=" + id
    });
  }
};

// Listar usuarios pendientes de aprobación
exports.listarPendientes = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      where: { estado: 'pendiente' },
      include: [{
        model: PerfilEscolar,
        as: 'perfil'
      }],
      order: [['fecha_creacion', 'DESC']]
    });
    
    res.send(usuarios);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error al obtener usuarios pendientes"
    });
  }
};

// Obtener roles de un usuario
exports.obtenerRoles = async (req, res) => {
  try {
    const id = req.params.id;
    
    const usuario = await Usuario.findByPk(id, {
      include: [{
        model: db.Rol,
        as: 'roles',
        through: { attributes: [] } // No incluir atributos de la tabla intermedia
      }]
    });
    
    if (!usuario) {
      return res.status(404).send({
        message: `No se encontró el usuario con ID=${id}.`
      });
    }
    
    res.send({
      tipo_usuario: usuario.tipo_usuario,
      roles: usuario.roles
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error al obtener los roles del usuario"
    });
  }
};

// Actualizar roles de un usuario
exports.actualizarRoles = async (req, res) => {
  try {
    const id = req.params.id;
    const { tipo_usuario, roles } = req.body;
    
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).send({
        message: `No se encontró el usuario con ID=${id}.`
      });
    }
    
    // Actualizar el tipo principal del usuario
    if (tipo_usuario) {
      await usuario.update({ tipo_usuario });
    }
    
    // Si se enviaron roles, actualizarlos
    if (roles && Array.isArray(roles)) {
      // Primero obtener los IDs de los roles
      const rolesDb = await db.Rol.findAll({
        where: {
          nombre: {
            [Op.in]: roles
          }
        }
      });
      
      // Obtener los IDs
      const roleIds = rolesDb.map(rol => rol.id);
      
      // Establecer los roles (esto reemplaza todos los roles existentes)
      await usuario.setRoles(roleIds);
    }
    
    res.send({
      message: "Roles actualizados correctamente"
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error al actualizar los roles del usuario"
    });
  }
};