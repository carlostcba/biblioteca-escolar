// middlewares/auth.jwt.js
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config.js');
const db = require('../models');
const Usuario = db.Usuario;
const Rol = db.Rol;
const Permiso = db.Permiso;

// Verificar si el token JWT es válido
const verifyToken = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  
  // Eliminar el prefijo 'Bearer ' si existe
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }
  
  if (!token) {
    return res.status(403).send({
      message: "No se proporcionó un token de autenticación.",
      redirectUrl: '/login.html'
    });
  }
  
  try {
    const decoded = jwt.verify(token, config.secret);
    req.userId = decoded.id;
    
    // Verificar si el usuario está activo
    Usuario.findByPk(req.userId)
      .then(usuario => {
        if (!usuario) {
          return res.status(404).send({
            message: "Usuario no encontrado.",
            redirectUrl: '/login.html'
          });
        }
        
        if (usuario.estado !== 'activo') {
          return res.status(403).send({
            message: "Tu cuenta no está activa. Por favor, contacta con el administrador.",
            redirectUrl: '/login.html'
          });
        }
        
        next();
      })
      .catch(err => {
        res.status(500).send({
          message: "Error al verificar el usuario.",
          redirectUrl: '/login.html'
        });
      });
  } catch (error) {
    return res.status(401).send({
      message: "No autorizado",
      redirectUrl: '/login.html'
    });
  }
};

/**
 * Verifica si el usuario es administrador
 */
const isAdmin = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.userId);
    const roles = await usuario.getRoles();
    
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].nombre === 'administrador') {
        return next();
      }
    }
    
    return res.status(403).send({
      message: "Se requiere rol de Administrador.",
      redirectUrl: '/catalogo.html'
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error al verificar rol de administrador.",
      redirectUrl: '/catalogo.html'
    });
  }
};

/**
 * Verifica si el usuario es bibliotecario o administrador
 */
const isBibliotecario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.userId);
    const roles = await usuario.getRoles();
    
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].nombre === 'bibliotecario' || roles[i].nombre === 'administrador') {
        return next();
      }
    }
    
    return res.status(403).send({
      message: "Se requiere rol de Bibliotecario o Administrador.",
      redirectUrl: '/catalogo.html'
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error al verificar rol de bibliotecario.",
      redirectUrl: '/catalogo.html'
    });
  }
};

/**
 * Verifica si el usuario es docente, bibliotecario o administrador
 */
const isDocente = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.userId);
    const roles = await usuario.getRoles();
    
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].nombre === 'docente' || roles[i].nombre === 'bibliotecario' || roles[i].nombre === 'administrador') {
        return next();
      }
    }
    
    return res.status(403).send({
      message: "Se requiere rol de Docente, Bibliotecario o Administrador.",
      redirectUrl: '/catalogo.html'
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error al verificar rol de docente.",
      redirectUrl: '/catalogo.html'
    });
  }
};

/**
 * Verifica si el usuario tiene el permiso específico
 * @param {string} permissionName - Nombre del permiso
 */
const hasPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      const usuario = await Usuario.findByPk(req.userId, {
        include: [{
          model: Rol,
          as: 'roles',
          include: [{
            model: Permiso,
            as: 'permisos',
            through: { attributes: [] }
          }]
        }]
      });
      
      // Verificar permisos en todos los roles
      let hasRequiredPermission = false;
      for (const rol of usuario.roles) {
        for (const permiso of rol.permisos) {
          if (permiso.nombre === permissionName) {
            hasRequiredPermission = true;
            break;
          }
        }
        if (hasRequiredPermission) break;
      }
      
      if (hasRequiredPermission) {
        return next();
      }
      
      return res.status(403).send({
        message: `No tienes permiso para realizar esta acción (${permissionName}).`,
        redirectUrl: '/catalogo.html'
      });
    } catch (error) {
      return res.status(500).send({
        message: "Error al verificar permisos.",
        redirectUrl: '/catalogo.html'
      });
    }
  };
};

const authJwt = {
  verifyToken,
  isAdmin,
  isBibliotecario,
  isDocente,
  hasPermission
};

module.exports = authJwt;