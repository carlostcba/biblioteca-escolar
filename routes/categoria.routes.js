// routes/categoria.routes.js
const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoria.controller');

// Obtener todas las categorías
router.get('/', categoriaController.obtenerTodos);

// Obtener una sola categoría por ID
router.get('/:id', categoriaController.obtenerPorId);

// Crear una nueva categoría
router.post('/', categoriaController.crear);

// Actualizar una categoría por ID
router.put('/:id', categoriaController.actualizar);

// Eliminar una categoría por ID
router.delete('/:id', categoriaController.eliminar);

module.exports = router;