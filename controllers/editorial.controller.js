// controllers/editorial.controller.js
const db = require('../models');
const Editorial = db.Editorial;
const Op = db.Sequelize.Op;

// Crear una nueva editorial
exports.crear = async (req, res) => {
  try {
    // Validar la solicitud
    if (!req.body.Nombre) {
      res.status(400).send({
        message: "El nombre de la editorial es obligatorio"
      });
      return;
    }

    // Crear una editorial
    const editorial = {
      Nombre: req.body.Nombre,
      Direccion: req.body.Direccion,
      Telefono: req.body.Telefono,
      Email: req.body.Email,
      SitioWeb: req.body.SitioWeb
    };

    // Guardar en la base de datos
    const data = await Editorial.create(editorial);
    res.status(201).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al crear la editorial."
    });
  }
};

// Obtener todas las editoriales
exports.obtenerTodas = async (req, res) => {
  try {
    const data = await Editorial.findAll();
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al obtener las editoriales."
    });
  }
};

// Obtener una editorial por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Editorial.findByPk(id);

    if (data) {
      res.send(data);
    } else {
      res.status(404).send({
        message: `No se encontró la editorial con ID=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener la editorial con ID=" + req.params.id
    });
  }
};

// Actualizar una editorial por ID
exports.actualizar = async (req, res) => {
  try {
    const id = req.params.id;
    const num = await Editorial.update(req.body, {
      where: { EditorialID: id }
    });

    if (num == 1) {
      res.send({
        message: "La editorial fue actualizada exitosamente."
      });
    } else {
      res.send({
        message: `No se pudo actualizar la editorial con ID=${id}. ¡Tal vez la editorial no fue encontrada o el cuerpo está vacío!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al actualizar la editorial con ID=" + req.params.id
    });
  }
};

// Eliminar una editorial por ID
exports.eliminar = async (req, res) => {
  try {
    const id = req.params.id;
    const num = await Editorial.destroy({
      where: { EditorialID: id }
    });

    if (num == 1) {
      res.send({
        message: "La editorial fue eliminada exitosamente."
      });
    } else {
      res.send({
        message: `No se pudo eliminar la editorial con ID=${id}. ¡Tal vez la editorial no fue encontrada!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "No se pudo eliminar la editorial con ID=" + req.params.id
    });
  }
};