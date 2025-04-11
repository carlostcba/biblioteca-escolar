// routes/ejemplar.routes.js
const express = require('express');
const router = express.Router();
const ejemplarController = require('../controllers/ejemplar.controller');
const { authJwt } = require('../middlewares');

// Obtener todos los ejemplares con filtros y libro asociado
router.get('/', [authJwt.verifyToken, authJwt.isBibliotecario], ejemplarController.obtenerTodos);

// Obtener un ejemplar por ID
router.get('/:id', [authJwt.verifyToken, authJwt.isBibliotecario], ejemplarController.obtenerPorId);

module.exports = router;
