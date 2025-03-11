// routes/ejemplar.routes.js
const express = require('express');
const router = express.Router();

// Rutas temporales para evitar errores
router.get('/', (req, res) => {
  res.status(200).send({ message: "Ruta de ejemplares funcionando correctamente" });
});

// Aquí posteriormente se agregarán las rutas reales para CRUD de ejemplares
// router.post('/', ejemplarController.crear);
// router.get('/:id', ejemplarController.obtenerPorId);
// router.put('/:id', ejemplarController.actualizar);
// router.delete('/:id', ejemplarController.eliminar);

module.exports = router;