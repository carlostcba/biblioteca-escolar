// controllers/auth.controller.js
const db = require('../models');
const config = require('../config/auth.config');
const Usuario = db.Usuario;
const PerfilEscolar = db.PerfilEscolar;
const Rol = db.Rol;
const Op = db.Sequelize.Op;

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Registro de nuevo usuario
exports.signup = async (req, res) => {
  try {
    // Validar datos básicos
    if (!req.body.nombre || !req.body.apellido || !req.body.email || !req.body.password || !req.body.tipo_usuario) {
      return res.status(400).send({
        message: "Todos los campos son obligatorios."
      });
    }
    
    // Verificar si el email ya está registrado
    const existingUser = await Usuario.findOne({
      where: {
        email: req.body.email
      }
    });
    
    if (existingUser) {
      return res.status(400).send({
        message: "Este correo electrónico ya está registrado."
      });
    }
    
    // Verificar si se requiere aprobación (esto podría venir de configuración del sistema)
    const requiereAprobacion = false; // Cambiado a falso para facilitar pruebas (cambia a true en producción)
    
    // Crear usuario en la base de datos
    const usuario = await Usuario.create({
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      tipo_usuario: req.body.tipo_usuario,
      estado: requiereAprobacion ? 'pendiente' : 'activo'
    });
    
    // Crear perfil escolar según el tipo de usuario
    if (req.body.tipo_usuario === 'alumno') {
      await PerfilEscolar.create({
        usuario_id: usuario.id,
        tipo_perfil: 'alumno',
        nivel_educativo: req.body.nivel,
        grado: req.body.grado,
        grupo: req.body.grupo,
        turno: req.body.turno,
        matricula: req.body.matricula
      });
    } else if (req.body.tipo_usuario === 'docente') {
      await PerfilEscolar.create({
        usuario_id: usuario.id,
        tipo_perfil: 'docente',
        departamento: req.body.departamento,
        codigo_empleado: req.body.codigo_empleado,
        asignaturas: req.body.asignaturas ? JSON.stringify(req.body.asignaturas) : null
      });
    } else if (req.body.tipo_usuario === 'administrador' || req.body.tipo_usuario === 'bibliotecario') {
      // También crear un perfil básico para administradores y bibliotecarios
      await PerfilEscolar.create({
        usuario_id: usuario.id,
        tipo_perfil: 'administrativo'
      });
    }
    
    // Asignar rol según el tipo de usuario
    let roles;
    switch (req.body.tipo_usuario) {
      case 'administrador':
        roles = await Rol.findAll({
          where: {
            nombre: 'administrador'
          }
        });
        break;
      case 'bibliotecario':
        roles = await Rol.findAll({
          where: {
            nombre: 'bibliotecario'
          }
        });
        break;
      case 'docente':
        roles = await Rol.findAll({
          where: {
            nombre: 'docente'
          }
        });
        break;
      case 'alumno':
      default:
        roles = await Rol.findAll({
          where: {
            nombre: 'alumno'
          }
        });
        break;
    }
    
    // Asignar roles al usuario
    if (roles && roles.length > 0) {
      await usuario.setRoles(roles);
    }
    
    res.status(201).send({
      message: requiereAprobacion ? 
        "Usuario registrado exitosamente. Tu cuenta será revisada por un administrador antes de ser activada." :
        "Usuario registrado exitosamente.",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario,
        estado: usuario.estado
      }
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).send({
      message: error.message || "Error al registrar usuario."
    });
  }
};

// Inicio de sesión
exports.signin = async (req, res) => {
  try {
    // Validar datos
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({
        message: "Correo electrónico y contraseña son obligatorios."
      });
    }
    
    // Buscar usuario por email
    const usuario = await Usuario.findOne({
      where: {
        email: req.body.email
      },
      include: [{
        model: Rol,
        as: 'roles',
        attributes: ['id', 'nombre'],
        through: { attributes: [] }
      }]
    });
    
    if (!usuario) {
      return res.status(404).send({
        message: "Usuario no encontrado."
      });
    }
    
    // Verificar el estado del usuario
    if (usuario.estado === 'pendiente') {
      return res.status(403).send({
        message: "Tu cuenta está pendiente de aprobación. Por favor, espera a que un administrador la active."
      });
    }
    
    if (usuario.estado === 'inactivo') {
      return res.status(403).send({
        message: "Tu cuenta está desactivada. Por favor, contacta al administrador."
      });
    }
    
    if (usuario.estado === 'suspendido') {
      return res.status(403).send({
        message: "Tu cuenta ha sido suspendida. Por favor, contacta al administrador."
      });
    }
    
    // Verificar contraseña
    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      usuario.password
    );
    
    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Contraseña incorrecta."
      });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id },
      config.secret,
      {
        algorithm: 'HS256',
        expiresIn: 86400 // 24 horas
      }
    );
    
    // Cargar información adicional según el tipo de usuario
    let perfilEscolar = null;
    perfilEscolar = await PerfilEscolar.findOne({
      where: {
        usuario_id: usuario.id
      }
    });
    
    // Actualizar última conexión
    await usuario.update({
      ultima_conexion: new Date()
    });
    
    // Preparar respuesta
    let authorities = [];
    if (usuario.roles && usuario.roles.length > 0) {
      authorities = usuario.roles.map(role => `ROLE_${role.nombre.toUpperCase()}`);
    }
    
    // Definir la URL de redirección según el tipo de usuario
    let redirectUrl = '/catalogo.html'; // Página predeterminada para todos los usuarios
    
    if (usuario.tipo_usuario === 'administrador') {
      redirectUrl = '/dashboard.html';
    } else if (usuario.tipo_usuario === 'bibliotecario') {
      redirectUrl = '/dashboard.html';
    }
    
    res.status(200).send({
      token,
      redirectUrl,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario,
        roles: authorities,
        perfil: perfilEscolar
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).send({
      message: error.message || "Error al iniciar sesión."
    });
  }
};

// Verificar si el usuario está autenticado
exports.checkAuth = async (req, res) => {
  try {
    // El middleware authJwt.verifyToken ya verificó el token
    // Solo necesitamos devolver la información del usuario
    
    const usuario = await Usuario.findByPk(req.userId, {
      attributes: ['id', 'nombre', 'apellido', 'email', 'tipo_usuario', 'estado'],
      include: [{
        model: Rol,
        as: 'roles',
        attributes: ['id', 'nombre'],
        through: { attributes: [] }
      }]
    });
    
    if (!usuario) {
      return res.status(404).send({
        message: "Usuario no encontrado.",
        redirectUrl: '/login.html'
      });
    }
    
    // Verificar si el usuario está activo
    if (usuario.estado !== 'activo') {
      return res.status(403).send({
        message: "Tu cuenta no está activa.",
        redirectUrl: '/login.html'
      });
    }
    
    // Cargar información adicional según el tipo de usuario
    let perfilEscolar = null;
    perfilEscolar = await PerfilEscolar.findOne({
      where: {
        usuario_id: usuario.id
      }
    });
    
    // Preparar respuesta
    let authorities = [];
    if (usuario.roles && usuario.roles.length > 0) {
      authorities = usuario.roles.map(role => `ROLE_${role.nombre.toUpperCase()}`);
    }
    
    res.status(200).send({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario,
        roles: authorities,
        perfil: perfilEscolar
      }
    });
    
  } catch (error) {
    console.error('Error en checkAuth:', error);
    res.status(500).send({
      message: error.message || "Error al verificar autenticación.",
      redirectUrl: '/login.html'
    });
  }
};

// Cerrar sesión (opcional, ya que el token se maneja en el cliente)
exports.signout = (req, res) => {
  // En un sistema basado en JWT, el cierre de sesión generalmente se maneja en el cliente
  // eliminando el token del almacenamiento (localStorage o sessionStorage)
  
  res.status(200).send({
    message: "Sesión cerrada exitosamente."
  });
};