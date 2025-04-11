// controllers/ejemplar.controller.js

const db = require('../models');
const Ejemplar = db.Ejemplar;
const Libro = db.Libro;
const { Op } = db.Sequelize;

// Obtener todos los ejemplares con libro asociado y filtros opcionales
exports.obtenerTodos = async (req, res) => {
  try {
    const { titulo, codigo, estado } = req.query;
    let condicion = {};

    if (codigo) {
      condicion.CodigoBarras = { [Op.like]: `%${codigo}%` };
    }

    if (estado) {
      condicion.Estado = estado;
    }

    const ejemplares = await Ejemplar.findAll({
      where: condicion,
      include: [{
        model: Libro,
        as: 'libro',
        where: titulo ? { Titulo: { [Op.like]: `%${titulo}%` } } : undefined
      }],
      order: [['EjemplarID', 'DESC']]
    });

    res.send(ejemplares);
  } catch (err) {
    console.error('Error al obtener ejemplares:', err);
    res.status(500).send({ message: 'Error al obtener ejemplares' });
  }
};

// Obtener un ejemplar por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const id = req.params.id;
    const ejemplar = await Ejemplar.findByPk(id);

    if (!ejemplar) {
      return res.status(404).send({ message: 'Ejemplar no encontrado' });
    }

    res.send(ejemplar);
  } catch (err) {
    console.error('Error al obtener ejemplar por ID:', err);
    res.status(500).send({ message: 'Error interno al buscar ejemplar' });
  }
};
