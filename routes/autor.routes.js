// routes/autor.routes.js
const express = require('express');
const router = express.Router();
const autorController = require('../controllers/autor.controller');

// Crear un nuevo autor
router.post('/', autorController.crear);

// Obtener todos los autores
router.get('/', autorController.obtenerTodos);

// Obtener un solo autor por ID
router.get('/:id', autorController.obtenerPorId);

// Actualizar un autor por ID
router.put('/:id', autorController.actualizar);

// Eliminar un autor por ID
router.delete('/:id', autorController.eliminar);

module.exports = router;