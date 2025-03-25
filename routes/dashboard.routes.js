// routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authJwt } = require('../middlewares');

// Ruta para estadísticas del dashboard
router.get('/estadisticas', [authJwt.verifyToken, authJwt.isBibliotecario], dashboardController.getEstadisticas);

module.exports = router;