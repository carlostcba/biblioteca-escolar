// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { verifySignUp } = require('../middlewares');
const { authJwt } = require('../middlewares');
const authController = require('../controllers/auth.controller');

// Ruta para registrar un nuevo usuario
router.post('/registro', [
  verifySignUp.checkDuplicateEmail,
  verifySignUp.checkUserType,
  verifySignUp.checkProfileFields
], authController.signup);

// Ruta para iniciar sesión
router.post('/login', authController.signin);

// Ruta para verificar si el usuario está autenticado
router.get('/check', [authJwt.verifyToken], authController.checkAuth);

// Ruta para cerrar sesión (opcional)
router.post('/logout', authController.signout);

module.exports = router;