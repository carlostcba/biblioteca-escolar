// routes/usuario.routes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { authJwt } = require('../middlewares');

// Crear un nuevo usuario - Esta ruta normalmente se gestiona a través de auth/registro
// router.post('/', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.crear);

// Obtener todos los usuarios
router.get('/', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.obtenerTodos);

// Obtener un solo usuario por ID
router.get('/:id', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.obtenerPorId);

// Actualizar un usuario por ID
router.put('/:id', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.actualizar);

// Eliminar un usuario por ID
router.delete('/:id', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.eliminar);

// Rutas para aprobación y gestión de estados
router.get('/pendientes', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.listarPendientes);
router.put('/:id/aprobar', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.aprobarUsuario);
router.put('/:id/estado', [authJwt.verifyToken, authJwt.isAdmin], usuarioController.cambiarEstado);

module.exports = router;