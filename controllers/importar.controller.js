// controllers/importar.controller.js
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const db = require('../models');

// Modelos
const Autor = db.Autor;
const Editorial = db.Editorial;
const Categoria = db.Categoria;
const Libro = db.Libro;
const Ejemplar = db.Ejemplar;

// Importar libros desde CSV
exports.importarLibros = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        message: "Por favor, seleccione un archivo CSV para importar."
      });
    }
    
    const resultados = {
      total: 0,
      exitosos: 0,
      fallidos: 0,
      errores: []
    };
    
    // Procesar el archivo CSV
    const registros = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv({
        separator: ',',
        skipLines: 0,
        headers: [
          'ISBN', 'Titulo', 'Autor', 'Editorial', 'FechaPublicacion',
          'Edicion', 'Idioma', 'Paginas', 'Descripcion', 'Categorias',
          'Ejemplares'
        ]
      }))
      .on('data', (data) => registros.push(data))
      .on('end', async () => {
        resultados.total = registros.length;
        
        // Procesar cada registro
        for (const registro of registros) {
          try {
            // Buscar o crear el autor
            const nombreAutor = registro.Autor.split(' ');
            const apellidoAutor = nombreAutor.pop(); // Último elemento como apellido
            const nombrePila = nombreAutor.join(' '); // Resto como nombre
            
            const [autor] = await Autor.findOrCreate({
              where: {
                Nombre: nombrePila,
                Apellido: apellidoAutor
              }
            });
            
            // Buscar o crear la editorial
            const [editorial] = await Editorial.findOrCreate({
              where: {
                Nombre: registro.Editorial
              }
            });
            
            // Crear el libro
            const libro = await Libro.create({
              ISBN: registro.ISBN,
              Titulo: registro.Titulo,
              AutorID: autor.AutorID,
              EditorialID: editorial.EditorialID,
              FechaPublicacion: registro.FechaPublicacion ? new Date(registro.FechaPublicacion) : null,
              Edicion: registro.Edicion,
              Idioma: registro.Idioma || 'Español',
              Paginas: parseInt(registro.Paginas, 10) || null,
              Descripcion: registro.Descripcion
            });
            
            // Procesar categorías
            if (registro.Categorias) {
              const nombresCategorias = registro.Categorias.split(',').map(c => c.trim());
              
              for (const nombreCategoria of nombresCategorias) {
                const [categoria] = await Categoria.findOrCreate({
                  where: {
                    Nombre: nombreCategoria
                  }
                });
                
                // Agregar categoría al libro
                await db.sequelize.query(
                  `INSERT INTO LibroCategorias (LibroID, CategoriaID) VALUES (${libro.LibroID}, ${categoria.CategoriaID})`
                );
              }
            }
            
            // Crear ejemplares
            const cantidadEjemplares = parseInt(registro.Ejemplares, 10) || 1;
            
            for (let i = 1; i <= cantidadEjemplares; i++) {
              await Ejemplar.create({
                LibroID: libro.LibroID,
                CodigoBarras: `${registro.ISBN || 'LIB'}-${libro.LibroID}-${i}`,
                NumeroCopia: i,
                Estado: 'Disponible'
              });
            }
            
            resultados.exitosos++;
          } catch (error) {
            resultados.fallidos++;
            resultados.errores.push({
              libro: registro.Titulo,
              error: error.message
            });
          }
        }
        
        // Borrar el archivo temporal
        fs.unlinkSync(req.file.path);
        
        // Devolver resultados
        res.send({
          message: "Importación completada",
          resultados
        });
      });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error durante la importación de libros."
    });
  }
};