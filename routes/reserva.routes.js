// routes/reserva.routes.js
const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reserva.controller');
const { authJwt } = require('../middlewares');

// Crear una nueva reserva (cualquier usuario autenticado)
router.post('/', [authJwt.verifyToken], reservaController.crear);

// Reservar un ejemplar específico
router.post('/ejemplar', [authJwt.verifyToken], reservaController.reservarEjemplar);

// Obtener todas las reservas (solo admin y bibliotecarios)
router.get('/', [
  authJwt.verifyToken, 
  authJwt.isBibliotecario
], reservaController.obtenerTodas);

// Obtener mis reservas (cualquier usuario autenticado)
router.get('/mis-reservas', [authJwt.verifyToken], reservaController.obtenerMisReservas);

// Obtener una reserva por ID
router.get('/:id', [authJwt.verifyToken], reservaController.obtenerPorId);

// Cambiar estado de reserva
router.put('/:id/estado', [authJwt.verifyToken], reservaController.cambiarEstado);

// Cancelar una reserva
router.put('/:id/cancelar', [authJwt.verifyToken], reservaController.cancelar);

module.exports = router;