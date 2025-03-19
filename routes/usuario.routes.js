// routes/usuario.routes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { authJwt } = require('../middlewares');

// Crear un nuevo usuario - Esta ruta normalmente se gestiona a través de auth/registro
// router.post('/', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.crear);

// Rutas para aprobación y gestión de estados - Movido antes de la ruta con parámetro :id
router.get('/pendientes', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.listarPendientes);

// Obtener perfil del usuario autenticado
router.get('/mi-perfil', [authJwt.verifyToken], usuarioController.obtenerMiPerfil);

// Actualizar perfil del usuario autenticado
router.put('/mi-perfil', [authJwt.verifyToken], usuarioController.actualizarMiPerfil);

// Obtener historial de actividad del usuario autenticado
router.get('/actividad', [authJwt.verifyToken], usuarioController.obtenerActividad);

// Obtener todos los usuarios
router.get('/', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.obtenerTodos);

// Obtener un solo usuario por ID
router.get('/:id', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.obtenerPorId);

// Actualizar un usuario por ID
router.put('/:id', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.actualizar);

// Eliminar un usuario por ID
router.delete('/:id', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.eliminar);

// Rutas para aprobación y cambios de estado
router.put('/:id/aprobar', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.aprobarUsuario);
router.put('/:id/estado', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.cambiarEstado);

// Rutas para gestión de roles
router.get('/:id/roles', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.obtenerRoles);
router.put('/:id/roles', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.actualizarRoles);

module.exports = router;