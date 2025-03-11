// routes/categoria.routes.js
const express = require('express');
const router = express.Router();

// Rutas temporales para evitar errores
router.post('/', (req, res) => {
  res.status(501).send({ message: "Funcionalidad no implementada aún" });
});

router.get('/', (req, res) => {
  res.status(501).send({ message: "Funcionalidad no implementada aún" });
});

router.get('/:id', (req, res) => {
  res.status(501).send({ message: "Funcionalidad no implementada aún" });
});

router.put('/:id', (req, res) => {
  res.status(501).send({ message: "Funcionalidad no implementada aún" });
});

router.delete('/:id', (req, res) => {
  res.status(501).send({ message: "Funcionalidad no implementada aún" });
});

module.exports = router;