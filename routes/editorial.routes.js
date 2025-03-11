// routes/editorial.routes.js
const express = require('express');
const router = express.Router();
const editorialController = require('../controllers/editorial.controller');

// Crear una nueva editorial
router.post('/', editorialController.crear);

// Obtener todas las editoriales
router.get('/', editorialController.obtenerTodas);

// Obtener una editorial por ID
router.get('/:id', editorialController.obtenerPorId);

// Actualizar una editorial por ID
router.put('/:id', editorialController.actualizar);

// Eliminar una editorial por ID
router.delete('/:id', editorialController.eliminar);

module.exports = router;  // Asegúrate de exportar el router, no un objeto