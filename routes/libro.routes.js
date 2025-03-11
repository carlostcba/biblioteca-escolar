// routes/libro.routes.js
const express = require('express');
const router = express.Router();
const libroController = require('../controllers/libro.controller');

// Crear un nuevo libro
router.post('/', libroController.crear);

// Obtener todos los libros
router.get('/', libroController.obtenerTodos);

// Obtener un solo libro por ID
router.get('/:id', libroController.obtenerPorId);

// Actualizar un libro por ID
router.put('/:id', libroController.actualizar);

// Eliminar un libro por ID
router.delete('/:id', libroController.eliminar);

module.exports = router;