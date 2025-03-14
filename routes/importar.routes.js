// routes/importar.routes.js
const express = require('express');
const router = express.Router();
const importarController = require('../controllers/importar.controller');
const exportarController = require('../controllers/exportar.controller');
const upload = require('../middlewares/upload');

// Ruta para importar libros desde CSV
router.post('/libros', upload.single('archivo'), importarController.importarLibros);

// Ruta para verificar el estado de una importación
router.get('/estado/:importID', importarController.verificarEstadoImportacion);

// Ruta para exportar libros a CSV o JSON
router.get('/exportar', exportarController.exportarLibros);

// Ruta para verificarimportaciones recientes
router.get('/recientes', importarController.listarImportacionesRecientes);

module.exports = router;