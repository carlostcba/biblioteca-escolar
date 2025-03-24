// routes/prestamo.routes.js
const express = require('express');
const router = express.Router();
const prestamoController = require('../controllers/prestamo.controller');
const { authJwt } = require('../middlewares');

// Obtener préstamos del usuario actual (¡IMPORTANTE! Esta ruta específica debe ir ANTES de la ruta con parámetro)
router.get('/mis-prestamos', [authJwt.verifyToken], prestamoController.obtenerMisPrestamos);

// Obtener todos los préstamos
router.get('/', [authJwt.verifyToken, authJwt.isBibliotecario], prestamoController.obtenerTodos);

// Crear un nuevo préstamo
router.post('/', [authJwt.verifyToken, authJwt.isBibliotecario], prestamoController.crear);

// Obtener un solo préstamo por ID
router.get('/:id', [authJwt.verifyToken], prestamoController.obtenerPorId);

// Actualizar un préstamo por ID
router.put('/:id', [authJwt.verifyToken, authJwt.isBibliotecario], prestamoController.actualizar);

// Registrar devolución
router.put('/:id/devolucion', [authJwt.verifyToken, authJwt.isBibliotecario], prestamoController.registrarDevolucion);

// Eliminar un préstamo por ID
router.delete('/:id', [authJwt.verifyToken, authJwt.isAdmin], prestamoController.eliminar);

module.exports = router;