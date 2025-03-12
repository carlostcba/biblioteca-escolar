// controllers/categoria.controller.js
const db = require('../models');
const Categoria = db.Categoria;

// Obtener todas las categorías
exports.obtenerTodos = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      order: [['Nombre', 'ASC']]
    });
    res.send(categorias);
  } catch (err) {
    console.error("Error en obtenerTodos (categorias):", err);
    res.status(500).send({
      message: err.message || "Ocurrió un error al obtener las categorías."
    });
  }
};

// Obtener una sola categoría por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const id = req.params.id;
    const categoria = await Categoria.findByPk(id);
    
    if (categoria) {
      res.send(categoria);
    } else {
      res.status(404).send({
        message: `No se encontró la categoría con ID=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener la categoría con ID=" + req.params.id
    });
  }
};

// Crear una nueva categoría
exports.crear = async (req, res) => {
  try {
    // Validar la solicitud
    if (!req.body.Nombre) {
      res.status(400).send({
        message: "El nombre de la categoría es obligatorio"
      });
      return;
    }

    // Crear una categoría
    const categoria = {
      Nombre: req.body.Nombre,
      Descripcion: req.body.Descripcion || null
    };

    // Guardar en la base de datos
    const data = await Categoria.create(categoria);
    res.status(201).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al crear la categoría."
    });
  }
};

// Actualizar una categoría por ID
exports.actualizar = async (req, res) => {
  try {
    const id = req.params.id;
    const num = await Categoria.update(req.body, {
      where: { CategoriaID: id }
    });

    if (num == 1) {
      res.send({
        message: "La categoría fue actualizada exitosamente."
      });
    } else {
      res.send({
        message: `No se pudo actualizar la categoría con ID=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al actualizar la categoría con ID=" + req.params.id
    });
  }
};

// Eliminar una categoría por ID
exports.eliminar = async (req, res) => {
  try {
    const id = req.params.id;
    const num = await Categoria.destroy({
      where: { CategoriaID: id }
    });

    if (num == 1) {
      res.send({
        message: "La categoría fue eliminada exitosamente."
      });
    } else {
      res.send({
        message: `No se pudo eliminar la categoría con ID=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "No se pudo eliminar la categoría con ID=" + req.params.id
    });
  }
};