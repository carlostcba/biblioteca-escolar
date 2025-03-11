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
        
        // Procesar cada registro individualmente sin transacción global
        for (const registro of registros) {
          // Crear transacción individual para cada libro
          const transaction = await db.sequelize.transaction({
            isolationLevel: 'READ COMMITTED'
          });
          
          try {
            // Buscar o crear el autor
            const nombreAutor = registro.Autor.split(' ');
            const apellidoAutor = nombreAutor.pop(); // Último elemento como apellido
            const nombrePila = nombreAutor.join(' '); // Resto como nombre
            
            let autor = await Autor.findOne({
              where: {
                Nombre: nombrePila,
                Apellido: apellidoAutor
              },
              transaction
            });
            
            if (!autor) {
              autor = await Autor.create({
                Nombre: nombrePila,
                Apellido: apellidoAutor,
                FechaCreacion: new Date(),
                FechaActualizacion: new Date()
              }, { transaction });
            }
            
            // Buscar o crear la editorial
            let editorial = await Editorial.findOne({
              where: {
                Nombre: registro.Editorial
              },
              transaction
            });
            
            if (!editorial) {
              editorial = await Editorial.create({
                Nombre: registro.Editorial,
                FechaCreacion: new Date(),
                FechaActualizacion: new Date()
              }, { transaction });
            }
            
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
              Descripcion: registro.Descripcion,
              FechaCreacion: new Date(),
              FechaActualizacion: new Date()
            }, { transaction });
            
            // Procesar categorías
            if (registro.Categorias) {
              const nombresCategorias = registro.Categorias.split(';').map(c => c.trim());
              
              for (const nombreCategoria of nombresCategorias) {
                let categoria = await Categoria.findOne({
                  where: {
                    Nombre: nombreCategoria
                  },
                  transaction
                });
                
                if (!categoria) {
                  categoria = await Categoria.create({
                    Nombre: nombreCategoria,
                    FechaCreacion: new Date(),
                    FechaActualizacion: new Date()
                  }, { transaction });
                }
                
                // Agregar categoría al libro usando el método de asociación de Sequelize
                await db.sequelize.query(
                  `INSERT INTO LibroCategorias (LibroID, CategoriaID) VALUES (${libro.LibroID}, ${categoria.CategoriaID})`,
                  { transaction }
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
                Estado: 'Disponible',
                FechaCreacion: new Date(),
                FechaActualizacion: new Date()
              }, { transaction });
            }
            
            // Confirmar la transacción
            await transaction.commit();
            resultados.exitosos++;
          } catch (error) {
            // Revertir la transacción en caso de error
            await transaction.rollback();
            
            resultados.fallidos++;
            resultados.errores.push({
              libro: registro.Titulo,
              error: error.message
            });
            
            console.error(`Error al importar ${registro.Titulo}:`, error);
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
    // Si hay un error general, asegurarse de limpiar el archivo si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).send({
      message: err.message || "Ocurrió un error durante la importación de libros."
    });
  }
};