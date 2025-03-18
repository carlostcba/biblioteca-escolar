// routes/perfil.routes.js
const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfil.controller');

// Obtener perfil del usuario actual
router.get('/', perfilController.obtenerPerfil);

// Crear un nuevo perfil
router.post('/', perfilController.crear);

// Obtener un perfil por ID
router.get('/:id', perfilController.obtenerPorId);

// Actualizar un perfil por ID
router.put('/:id', perfilController.actualizar); // perfilController.actualizar es undefined

// Eliminar un perfil por ID
router.delete('/:id', perfilController.eliminar);

module.exports = router;