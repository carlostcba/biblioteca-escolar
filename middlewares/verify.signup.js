// middlewares/verify.signup.js
const db = require('../models');
const Usuario = db.Usuario;
const Rol = db.Rol;

/**
 * Verifica si el correo electrónico ya existe
 */
const checkDuplicateEmail = async (req, res, next) => {
  try {
    // Verificar email
    const usuario = await Usuario.findOne({
      where: {
        email: req.body.email
      }
    });

    if (usuario) {
      return res.status(400).send({
        message: "Error: Este correo electrónico ya está registrado."
      });
    }

    next();
  } catch (error) {
    return res.status(500).send({
      message: "Error al verificar el correo electrónico."
    });
  }
};

/**
 * Verifica si los roles especificados existen
 */
const checkRolesExisted = async (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      try {
        const role = await Rol.findOne({
          where: {
            nombre: req.body.roles[i]
          }
        });
        
        if (!role) {
          return res.status(400).send({
            message: `Error: El rol ${req.body.roles[i]} no existe.`
          });
        }
      } catch (error) {
        return res.status(500).send({
          message: "Error al verificar los roles."
        });
      }
    }
  }
  
  next();
};

/**
 * Verifica que el tipo de usuario sea válido
 */
const checkUserType = (req, res, next) => {
  const validTypes = ['administrador', 'bibliotecario', 'docente', 'alumno', 'personal'];
  
  if (req.body.tipo_usuario && !validTypes.includes(req.body.tipo_usuario)) {
    return res.status(400).send({
      message: `Error: El tipo de usuario '${req.body.tipo_usuario}' no es válido. Debe ser uno de: ${validTypes.join(', ')}`
    });
  }
  
  next();
};

/**
 * Verifica que los campos específicos del perfil estén presentes según el tipo de usuario
 */
const checkProfileFields = (req, res, next) => {
  const { tipo_usuario } = req.body;
  
  if (tipo_usuario === 'alumno') {
    // Verificar campos obligatorios para alumnos
    const requiredFields = ['nivel', 'grado', 'turno'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).send({
        message: `Error: Faltan campos obligatorios para el perfil de alumno: ${missingFields.join(', ')}`
      });
    }
  } else if (tipo_usuario === 'docente') {
    // Verificar campos obligatorios para docentes
    const requiredFields = ['departamento'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).send({
        message: `Error: Faltan campos obligatorios para el perfil de docente: ${missingFields.join(', ')}`
      });
    }
  }
  
  next();
};

const verifySignUp = {
  checkDuplicateEmail,
  checkRolesExisted,
  checkUserType,
  checkProfileFields
};

module.exports = verifySignUp;