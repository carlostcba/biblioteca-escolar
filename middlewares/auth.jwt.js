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
        
        // Añadir información del usuario a la request
        req.user = usuario;
        req.userRole = usuario.tipo_usuario; // Añadir userRole basado en tipo_usuario
        
        next();
      })
      .catch(err => {
        console.error("Error al verificar token:", err);
        res.status(500).send({
          message: "Error al verificar el usuario.",
          redirectUrl: '/login.html'
        });
      });
  } catch (error) {
    console.error("Error en verificación de token:", error);
    return res.status(401).send({
      message: "Token inválido o expirado.",
      redirectUrl: '/login.html'
    });
  }
};

/**
 * Verifica si el usuario es administrador
 */
const isAdmin = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.userId, {
      include: [{
        model: Rol,
        as: 'roles',
        attributes: ['nombre'],
        through: { attributes: [] }
      }]
    });

    if (!usuario) {
      return res.status(404).send({
        message: "Usuario no encontrado.",
        redirectUrl: '/login.html'
      });
    }
    
    // Optimización: verificar directamente si existe el rol de administrador
    const isUserAdmin = usuario.roles.some(role => role.nombre === 'administrador');
    
    if (isUserAdmin || usuario.tipo_usuario === 'administrador') {
      req.userRole = 'administrador'; // Asegurar que userRole está correctamente establecido
      return next();
    }
    
    return res.status(403).send({
      message: "Se requiere rol de Administrador.",
      redirectUrl: '/catalogo.html'
    });
  } catch (error) {
    console.error("Error al verificar rol de administrador:", error);
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
    const usuario = await Usuario.findByPk(req.userId, {
      include: [{
        model: Rol,
        as: 'roles',
        attributes: ['nombre'],
        through: { attributes: [] }
      }]
    });

    if (!usuario) {
      return res.status(404).send({
        message: "Usuario no encontrado.",
        redirectUrl: '/login.html'
      });
    }
    
    // Optimización: verificar directamente si tiene alguno de los roles requeridos
    const hasRequiredRole = usuario.roles.some(role => 
      role.nombre === 'bibliotecario' || role.nombre === 'administrador'
    );
    
    if (hasRequiredRole || 
        usuario.tipo_usuario === 'bibliotecario' || 
        usuario.tipo_usuario === 'administrador') {
      // Establecer el rol más alto para los permisos
      if (usuario.tipo_usuario === 'administrador' || 
          usuario.roles.some(role => role.nombre === 'administrador')) {
        req.userRole = 'administrador';
      } else {
        req.userRole = 'bibliotecario';
      }
      return next();
    }
    
    return res.status(403).send({
      message: "Se requiere rol de Bibliotecario o Administrador.",
      redirectUrl: '/catalogo.html'
    });
  } catch (error) {
    console.error("Error al verificar rol de bibliotecario:", error);
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
    const usuario = await Usuario.findByPk(req.userId, {
      include: [{
        model: Rol,
        as: 'roles',
        attributes: ['nombre'],
        through: { attributes: [] }
      }]
    });

    if (!usuario) {
      return res.status(404).send({
        message: "Usuario no encontrado.",
        redirectUrl: '/login.html'
      });
    }
    
    // Optimización: verificar directamente si tiene alguno de los roles requeridos
    const hasRequiredRole = usuario.roles.some(role => 
      role.nombre === 'docente' || role.nombre === 'bibliotecario' || role.nombre === 'administrador'
    );
    
    if (hasRequiredRole || 
        usuario.tipo_usuario === 'docente' || 
        usuario.tipo_usuario === 'bibliotecario' || 
        usuario.tipo_usuario === 'administrador') {
      // Establecer el rol más alto para los permisos
      if (usuario.tipo_usuario === 'administrador' || 
          usuario.roles.some(role => role.nombre === 'administrador')) {
        req.userRole = 'administrador';
      } else if (usuario.tipo_usuario === 'bibliotecario' || 
                usuario.roles.some(role => role.nombre === 'bibliotecario')) {
        req.userRole = 'bibliotecario';
      } else {
        req.userRole = 'docente';
      }
      return next();
    }
    
    return res.status(403).send({
      message: "Se requiere rol de Docente, Bibliotecario o Administrador.",
      redirectUrl: '/catalogo.html'
    });
  } catch (error) {
    console.error("Error al verificar rol de docente:", error);
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
            attributes: ['nombre'],
            through: { attributes: [] }
          }]
        }]
      });

      if (!usuario) {
        return res.status(404).send({
          message: "Usuario no encontrado.",
          redirectUrl: '/login.html'
        });
      }
      
      // Optimización: usar algoritmo más eficiente para verificar permisos
      const hasRequiredPermission = usuario.roles.some(rol => 
        rol.permisos.some(permiso => permiso.nombre === permissionName)
      );
      
      if (hasRequiredPermission) {
        // Asegurar que userRole está establecido basado en tipo_usuario
        req.userRole = usuario.tipo_usuario;
        return next();
      }
      
      return res.status(403).send({
        message: `No tienes permiso para realizar esta acción (${permissionName}).`,
        redirectUrl: '/catalogo.html'
      });
    } catch (error) {
      console.error("Error al verificar permisos:", error);
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