// controllers/autor.controller.js
const db = require('../models');
const Autor = db.Autor;
const Op = db.Sequelize.Op;

// Crear un nuevo autor
exports.crear = async (req, res) => {
  try {
    // Validar la solicitud
    if (!req.body.Nombre || !req.body.Apellido) {
      res.status(400).send({
        message: "El nombre y apellido son obligatorios"
      });
      return;
    }

    // Crear un autor
    const autor = {
      Nombre: req.body.Nombre,
      Apellido: req.body.Apellido,
      Biografia: req.body.Biografia,
      FechaNacimiento: req.body.FechaNacimiento,
      Nacionalidad: req.body.Nacionalidad
    };

    // Guardar en la base de datos
    const data = await Autor.create(autor);
    res.status(201).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al crear el autor."
    });
  }
};

// Obtener todos los autores
exports.obtenerTodos = async (req, res) => {
  try {
    const data = await Autor.findAll();
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al obtener los autores."
    });
  }
};

// Obtener un solo autor por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Autor.findByPk(id, {
      include: [{
        model: db.Libro,
        as: 'libros'
      }]
    });

    if (data) {
      res.send(data);
    } else {
      res.status(404).send({
        message: `No se encontró el autor con ID=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener el autor con ID=" + req.params.id
    });
  }
};

// Actualizar un autor por ID
exports.actualizar = async (req, res) => {
  try {
    const id = req.params.id;
    const num = await Autor.update(req.body, {
      where: { AutorID: id }
    });

    if (num == 1) {
      res.send({
        message: "El autor fue actualizado exitosamente."
      });
    } else {
      res.send({
        message: `No se pudo actualizar el autor con ID=${id}. ¡Tal vez el autor no fue encontrado o el cuerpo está vacío!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al actualizar el autor con ID=" + req.params.id
    });
  }
};

// Eliminar un autor por ID
exports.eliminar = async (req, res) => {
  try {
    const id = req.params.id;
    const num = await Autor.destroy({
      where: { AutorID: id }
    });

    if (num == 1) {
      res.send({
        message: "El autor fue eliminado exitosamente."
      });
    } else {
      res.send({
        message: `No se pudo eliminar el autor con ID=${id}. ¡Tal vez el autor no fue encontrado!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "No se pudo eliminar el autor con ID=" + req.params.id
    });
  }
};