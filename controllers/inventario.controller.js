const db = require('../models');
const Libro = db.Libro;
const Ejemplar = db.Ejemplar;
const Autor = db.Autor;
const Editorial = db.Editorial;
const { Op } = db.Sequelize;

exports.crearLibro = async (req, res) => {
  try {
    const { Titulo, ISBN, Autor: autorNombre, Editorial: editorialNombre, Descripcion } = req.body;

    if (!Titulo || !autorNombre || !editorialNombre) {
      return res.status(400).send({ message: 'Título, autor y editorial son obligatorios' });
    }

    // Buscar o crear autor
    const [autor] = await Autor.findOrCreate({ where: { Nombre: autorNombre } });

    // Buscar o crear editorial
    const [editorial] = await Editorial.findOrCreate({ where: { Nombre: editorialNombre } });

    // Crear libro
    const libro = await Libro.create({
      Titulo,
      ISBN,
      Descripcion,
      AutorID: autor.AutorID,
      EditorialID: editorial.EditorialID
    });

    res.status(201).send(libro);
  } catch (err) {
    console.error('Error al crear libro:', err);
    res.status(500).send({ message: 'Error interno al crear libro' });
  }
};

exports.crearEjemplar = async (req, res) => {
  try {
    const { CodigoBarras, Signatura, Condicion, LibroID } = req.body;

    if (!CodigoBarras || !LibroID) {
      return res.status(400).send({ message: 'Código de barras y ID de libro son obligatorios' });
    }

    const ejemplar = await Ejemplar.create({
      CodigoBarras,
      Signatura,
      Condicion: Condicion || 'Bueno',
      LibroID,
      Estado: 'Disponible'
    });

    res.status(201).send(ejemplar);
  } catch (err) {
    console.error('Error al crear ejemplar:', err);
    res.status(500).send({ message: 'Error interno al crear ejemplar' });
  }
};

// Puedes extender este archivo con funciones para editar libros/ejemplares o listarlos con filtros
