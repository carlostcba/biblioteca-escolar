// routes/importar.routes.js
const express = require('express');
const router = express.Router();
const importarController = require('../controllers/importar.controller');
const upload = require('../middlewares/upload');

// Ruta para importar libros desde CSV
router.post('/libros', upload.single('archivo'), importarController.importarLibros);

module.exports = router;