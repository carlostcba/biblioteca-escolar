const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller');
const { authJwt } = require('../middlewares');

// Crear nuevo libro
router.post('/libros', [authJwt.verifyToken, authJwt.isBibliotecario], inventarioController.crearLibro);

// Crear nuevo ejemplar
router.post('/ejemplares', [authJwt.verifyToken, authJwt.isBibliotecario], inventarioController.crearEjemplar);

module.exports = router;
