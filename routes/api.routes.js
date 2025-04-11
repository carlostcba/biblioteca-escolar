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
const reservaRoutes = require('./reserva.routes');
const prestamoRoutes = require('./prestamo.routes');
const usuarioRoutes = require('./usuario.routes');
const dashboardRoutes = require('./dashboard.routes');
const inventarioRoutes = require('./inventario.routes');
//const reporteRoutes = require('./reporte.routes');

// Usar las rutas
router.use('/autores', autorRoutes);
router.use('/editoriales', editorialRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/libros', libroRoutes);
router.use('/ejemplares', ejemplarRoutes);
router.use('/importar', importarRoutes);
router.use('/reservas', reservaRoutes);
router.use('/prestamos', prestamoRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/inventario', inventarioRoutes);
//router.use('/reportes', reporteRoutes);

// Ruta de verificación para la API
router.get('/', (req, res) => {
  res.send({
    message: "Bienvenido a la API de Biblioteca Escolar",
    status: "online",
    version: "1.0"
  });
});

module.exports = router;