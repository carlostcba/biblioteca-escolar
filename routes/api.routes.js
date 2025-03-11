// routes/api.routes.js
const express = require('express');
const router = express.Router();

// Importar todas las rutas
const autorRoutes = require('./autor.routes');
const editorialRoutes = require('./editorial.routes');
const categoriaRoutes = require('./categoria.routes');
const libroRoutes = require('./libro.routes');
const ejemplarRoutes = require('./ejemplar.routes');
const importarRoutes = require('./importar.routes');

// Usar las rutas
router.use('/autores', autorRoutes);
router.use('/editoriales', editorialRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/libros', libroRoutes);
router.use('/ejemplares', ejemplarRoutes);
router.use('/importar', importarRoutes);

// Ruta de verificación para la API
router.get('/', (req, res) => {
  res.send({
    message: "Bienvenido a la API de Biblioteca Escolar",
    status: "online",
    version: "1.0"
  });
});

module.exports = router;