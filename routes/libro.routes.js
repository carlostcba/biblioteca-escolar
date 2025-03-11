// routes/libro.routes.js - versión mínima para probar
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send({ message: "Ruta de libros funcionando correctamente" });
});

module.exports = router;