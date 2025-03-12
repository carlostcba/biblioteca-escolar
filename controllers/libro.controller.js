// controllers/libro.controller.js
const db = require('../models');
const Libro = db.Libro;
const Autor = db.Autor;
const Editorial = db.Editorial;
const Categoria = db.Categoria;
const Ejemplar = db.Ejemplar;
const Op = db.Sequelize.Op;

// Crear un nuevo libro
exports.crear = async (req, res) => {
  try {
    // Validar la solicitud
    if (!req.body.Titulo || !req.body.AutorID || !req.body.EditorialID) {
      res.status(400).send({
        message: "El título, autor y editorial son obligatorios"
      });
      return;
    }

    // Crear un libro
    const libro = {
      ISBN: req.body.ISBN,
      Titulo: req.body.Titulo,
      AutorID: req.body.AutorID,
      EditorialID: req.body.EditorialID,
      FechaPublicacion: req.body.FechaPublicacion,
      Edicion: req.body.Edicion,
      Idioma: req.body.Idioma,
      Paginas: req.body.Paginas,
      Descripcion: req.body.Descripcion,
      TablaContenido: req.body.TablaContenido,
      ImagenPortada: req.body.ImagenPortada,
      Formato: req.body.Formato,
      TipoMaterial: req.body.TipoMaterial,
      ClasificacionDewey: req.body.ClasificacionDewey,
      ClasificacionLCC: req.body.ClasificacionLCC,
      VisibleEnCatalogo: req.body.VisibleEnCatalogo !== undefined ? req.body.VisibleEnCatalogo : true
    };

    // Guardar en la base de datos
    const data = await Libro.create(libro);
    
    // Asignar categorías si existen
    if (req.body.categorias && req.body.categorias.length > 0) {
      const categorias = await Categoria.findAll({
        where: {
          CategoriaID: {
            [Op.in]: req.body.categorias
          }
        }
      });
      await data.setCategorias(categorias);
    }
    
    res.status(201).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al crear el libro."
    });
  }
};

// Obtener todos los libros (con opciones de filtrado y paginación)
exports.obtenerTodos = async (req, res) => {
  try {
    const { titulo, autor, categoria, page = 1, size = 10 } = req.query;
    const limit = parseInt(size);
    const offset = (parseInt(page) - 1) * limit;
    
    let condicion = {};
    let includes = [
      {
        model: Autor,
        as: 'autor'
      },
      {
        model: Editorial,
        as: 'editorial'
      },
      {
        model: Categoria,
        as: 'categorias',
        through: { attributes: [] }
      },
      {
        model: Ejemplar,
        as: 'ejemplares',
        attributes: ['EjemplarID', 'CodigoBarras', 'Estado']
      }
    ];

    // Filtrar por título
    if (titulo) {
      condicion.Titulo = { [Op.like]: `%${titulo}%` };
    }
    
    // Filtrar por autor
    if (autor) {
      includes[0].where = {
        [Op.or]: [
          { Nombre: { [Op.like]: `%${autor}%` } },
          { Apellido: { [Op.like]: `%${autor}%` } }
        ]
      };
    }
    
    // Filtrar por categoría
    if (categoria) {
      // Modificar aquí: cambiar la búsqueda por nombre a búsqueda por ID
      const categoriaId = parseInt(categoria, 10);
      if (!isNaN(categoriaId)) {
        // Si es un número válido, filtrar por ID de categoría
        includes[2].where = { 
          CategoriaID: categoriaId 
        };
      } else {
        // Si no es un número, mantener la búsqueda por nombre (por compatibilidad)
        includes[2].where = { 
          Nombre: { [Op.like]: `%${categoria}%` } 
        };
      }
    }

    const { count, rows } = await Libro.findAndCountAll({
      where: condicion,
      include: includes,
      limit,
      offset,
      distinct: true
    });

    res.send({
      totalItems: count,
      libros: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error("Error en obtenerTodos (libros):", err);
    res.status(500).send({
      message: err.message || "Ocurrió un error al obtener los libros."
    });
  }
};

// Obtener un solo libro por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Libro.findByPk(id, {
      include: [
        {
          model: Autor,
          as: 'autor'
        },
        {
          model: Editorial,
          as: 'editorial'
        },
        {
          model: Categoria,
          as: 'categorias',
          through: { attributes: [] }
        },
        {
          model: Ejemplar,
          as: 'ejemplares'
        }
      ]
    });

    if (data) {
      res.send(data);
    } else {
      res.status(404).send({
        message: `No se encontró el libro con ID=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener el libro con ID=" + req.params.id
    });
  }
};

// Actualizar un libro por ID
exports.actualizar = async (req, res) => {
  try {
    const id = req.params.id;
    const libro = await Libro.findByPk(id);
    
    if (!libro) {
      return res.status(404).send({
        message: `No se encontró el libro con ID=${id}.`
      });
    }
    
    // Actualizar datos básicos
    const num = await Libro.update(req.body, {
      where: { LibroID: id }
    });
    
    // Actualizar categorías si se han enviado
    if (req.body.categorias && req.body.categorias.length > 0) {
      const categorias = await Categoria.findAll({
        where: {
          CategoriaID: {
            [Op.in]: req.body.categorias
          }
        }
      });
      await libro.setCategorias(categorias);
    }

    res.send({
      message: "El libro fue actualizado exitosamente."
    });
  } catch (err) {
    res.status(500).send({
      message: "Error al actualizar el libro con ID=" + req.params.id
    });
  }
};

// Eliminar un libro por ID
exports.eliminar = async (req, res) => {
  try {
    const id = req.params.id;
    const num = await Libro.destroy({
      where: { LibroID: id }
    });

    if (num == 1) {
      res.send({
        message: "El libro fue eliminado exitosamente."
      });
    } else {
      res.send({
        message: `No se pudo eliminar el libro con ID=${id}. ¡Tal vez el libro no fue encontrado!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "No se pudo eliminar el libro con ID=" + req.params.id
    });
  }
};