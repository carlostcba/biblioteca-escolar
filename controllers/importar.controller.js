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

// Función para validar y formatear fechas
function parseDate(dateString) {
  if (!dateString || dateString.trim() === '') {
    return null;
  }
  
  try {
    // Manejar formatos de fecha comunes
    if (dateString.includes('-')) {
      // Formato ISO YYYY-MM-DD
      const partes = dateString.split('-');
      if (partes.length === 3) {
        return new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
      }
    } else if (dateString.includes('/')) {
      // Formato DD/MM/YYYY o MM/DD/YYYY
      const partes = dateString.split('/');
      if (partes.length === 3) {
        // Asumimos que es DD/MM/YYYY
        return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
      }
    }
    
    // Intentar conversión estándar como último recurso
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    console.error(`Error al parsear fecha "${dateString}":`, e.message);
    return null;
  }
}

// Función para validar datos del libro
function validarDatosLibro(registro) {
  const errores = [];
  
  // Detectar si es fila de encabezados
  if (registro.Titulo === 'Titulo' && registro.ISBN === 'ISBN') {
    return ['Fila de encabezados detectada, omitiendo'];
  }
  
  // Validar campos obligatorios
  if (!registro.Titulo || registro.Titulo.trim() === '') {
    errores.push('El título es obligatorio');
  }
  
  if (!registro.Autor || registro.Autor.trim() === '') {
    errores.push('El autor es obligatorio');
  }
  
  // Validar ISBN (formato básico)
  if (registro.ISBN && registro.ISBN.trim() !== '') {
    const isbn = registro.ISBN.replace(/[-\s]/g, '');
    if (!(isbn.length === 10 || isbn.length === 13) || isNaN(isbn)) {
      errores.push('El ISBN debe tener 10 o 13 dígitos');
    }
  }
  
  // Validar páginas como número
  if (registro.Paginas && registro.Paginas.toString().trim() !== '') {
    const paginas = parseInt(registro.Paginas, 10);
    if (isNaN(paginas)) {
      errores.push('El número de páginas debe ser un valor numérico');
    }
  }
  
  // Validar ejemplares como número positivo
  if (registro.Ejemplares) {
    const ejemplares = parseInt(registro.Ejemplares, 10);
    if (isNaN(ejemplares) || ejemplares < 1) {
      errores.push('El número de ejemplares debe ser un valor numérico positivo');
    }
  }
  
  return errores;
}

// Función para mapear columnas CSV
function mapearColumnas(registro, mapeo) {
  const registroMapeado = {};
  
  Object.keys(mapeo).forEach(campoDestino => {
    const campoOrigen = mapeo[campoDestino] || campoDestino;
    registroMapeado[campoDestino] = registro[campoOrigen];
  });
  
  return registroMapeado;
}

// Función para buscar y actualizar libro existente
async function buscarYActualizarLibro(isbn, datos, nuevoDatosLibro) {
  if (!isbn) return null;
  
  try {
    // Buscar libro por ISBN
    const [librosResultado] = await db.sequelize.query(
      `SELECT LibroID FROM Libros WHERE ISBN = N'${isbn}'`
    );
    
    if (librosResultado.length > 0) {
      const libroID = librosResultado[0].LibroID;
      
      // Formatear la fecha de publicación
      let fechaPublicacionSQL = 'NULL';
      if (nuevoDatosLibro.fechaPublicacion) {
        fechaPublicacionSQL = `'${nuevoDatosLibro.fechaPublicacion}'`;
      }
      
      // Actualizar libro existente
      await db.sequelize.query(`
        UPDATE Libros 
        SET Titulo = N'${nuevoDatosLibro.titulo.replace(/'/g, "''")}',
            AutorID = ${datos.autorID},
            EditorialID = ${datos.editorialID},
            FechaPublicacion = ${fechaPublicacionSQL},
            Edicion = N'${(nuevoDatosLibro.edicion || '').replace(/'/g, "''")}',
            Idioma = N'${(nuevoDatosLibro.idioma || 'Español').replace(/'/g, "''")}',
            Paginas = ${nuevoDatosLibro.paginas || 'NULL'},
            Descripcion = N'${(nuevoDatosLibro.descripcion || '').replace(/'/g, "''")}',
            FechaActualizacion = GETDATE()
        WHERE LibroID = ${libroID}
      `);
      
      return libroID;
    }
  } catch (error) {
    console.error(`Error al buscar/actualizar libro con ISBN ${isbn}:`, error);
  }
  
  return null;
}

// Importar libros desde CSV - Versión con solución específica para el problema _0, _1, etc.
exports.importarLibros = async (req, res) => {
  try {
    // Validar archivo
    if (!req.file) {
      return res.status(400).send({
        message: "Por favor, seleccione un archivo CSV para importar."
      });
    }
    
    console.log('=== INICIO DE IMPORTACIÓN ===');
    console.log('Archivo recibido:', req.file.originalname);
    
    // Leer contenido del archivo para diagnóstico y preprocesamiento
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const lineas = fileContent.split('\n');
    
    if (lineas.length < 2) {
      return res.status(400).send({
        message: "El archivo CSV está vacío o no contiene suficientes datos."
      });
    }
    
    // Extraer encabezados de la primera línea
    const encabezadosLine = lineas[0].trim();
    console.log('Línea de encabezados:', encabezadosLine);
    
    // Detectar el separador
    let separador = ',';
    if (encabezadosLine.includes(';')) {
      separador = ';';
    }
    console.log(`Separador detectado: "${separador}"`);
    
    // Extraer los nombres de encabezados
    const encabezados = encabezadosLine.split(separador).map(h => h.trim());
    console.log('Encabezados extraídos:', encabezados);
    
    // Comprobar si los encabezados esperados están presentes
    const encabezadosEsperados = ['ISBN', 'Titulo', 'Autor', 'Editorial'];
    const encabezadosFaltantes = encabezadosEsperados.filter(h => 
      !encabezados.some(eh => eh.toLowerCase() === h.toLowerCase())
    );
    
    if (encabezadosFaltantes.length > 0) {
      console.log('Faltan encabezados esperados:', encabezadosFaltantes);
    }
    
    // Configuración de importación
    const opciones = {
      actualizar: req.body.actualizar === 'true',
      mapeo: req.body.mapeo ? JSON.parse(req.body.mapeo) : null,
      columnasSeparadas: req.body.columnasSeparadas === 'true'
    };
    
    const resultados = {
      total: 0,
      exitosos: 0,
      actualizados: 0,
      fallidos: 0,
      errores: []
    };
    
    // Procesar el archivo manualmente para evitar problemas con el parser csv
    const registros = [];
    
    // Saltar la primera línea (encabezados) y procesar cada línea como un registro
    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      if (!linea) continue; // Saltar líneas vacías
      
      // Dividir la línea en campos usando el separador
      // Nota: esto es una simplificación, no maneja comillas correctamente
      const valores = linea.split(separador).map(v => v.trim());
      
      if (valores.length !== encabezados.length) {
        console.log(`La línea ${i+1} tiene un número diferente de campos (${valores.length}) que los encabezados (${encabezados.length})`);
        continue;
      }
      
      // Crear un objeto con los valores mapeados a sus encabezados
      const registro = {};
      for (let j = 0; j < encabezados.length; j++) {
        // Normalizar el nombre del encabezado para la correspondencia correcta
        let nombreCampo = encabezados[j];
        // Convertir a formato esperado por el código (primera letra mayúscula)
        if (nombreCampo.toLowerCase() === 'isbn') nombreCampo = 'ISBN';
        else if (nombreCampo.toLowerCase() === 'titulo') nombreCampo = 'Titulo';
        else if (nombreCampo.toLowerCase() === 'autor') nombreCampo = 'Autor';
        else if (nombreCampo.toLowerCase() === 'editorial') nombreCampo = 'Editorial';
        else if (nombreCampo.toLowerCase() === 'fechapublicacion') nombreCampo = 'FechaPublicacion';
        else if (nombreCampo.toLowerCase() === 'edicion') nombreCampo = 'Edicion';
        else if (nombreCampo.toLowerCase() === 'idioma') nombreCampo = 'Idioma';
        else if (nombreCampo.toLowerCase() === 'paginas') nombreCampo = 'Paginas';
        else if (nombreCampo.toLowerCase() === 'descripcion') nombreCampo = 'Descripcion';
        else if (nombreCampo.toLowerCase() === 'categorias') nombreCampo = 'Categorias';
        else if (nombreCampo.toLowerCase() === 'ejemplares') nombreCampo = 'Ejemplares';
        
        registro[nombreCampo] = valores[j];
      }
      
      registros.push(registro);
    }
    
    console.log(`Se han procesado ${registros.length} registros del CSV`);
    
    if (registros.length > 0) {
      console.log('Primer registro:', JSON.stringify(registros[0]));
    }
    
    resultados.total = registros.length;
    
    // Procesar cada registro individualmente
    for (const registro of registros) {
      // Asegurarse de que todos los campos existan con la capitalización correcta
      const registroNormalizado = {
        ISBN: registro.ISBN || '',
        Titulo: registro.Titulo || '',
        Autor: registro.Autor || '',
        Editorial: registro.Editorial || '',
        FechaPublicacion: registro.FechaPublicacion || '',
        Edicion: registro.Edicion || '',
        Idioma: registro.Idioma || 'Español',
        Paginas: registro.Paginas || '',
        Descripcion: registro.Descripcion || '',
        Categorias: registro.Categorias || '',
        Ejemplares: registro.Ejemplares || '1'
      };
      
      console.log(`Procesando registro: ${registroNormalizado.Titulo}`);
      
      try {
        // Saltar la fila si parece que es de encabezados
        if (
          (registroNormalizado.ISBN === 'ISBN' && registroNormalizado.Titulo === 'Titulo') ||
          (registroNormalizado.Titulo.toLowerCase() === 'titulo' && registroNormalizado.Autor.toLowerCase() === 'autor')
        ) {
          console.log('Omitiendo fila de encabezados');
          continue;
        }
        
        // Validar datos
        const erroresValidacion = validarDatosLibro(registroNormalizado);
        if (erroresValidacion.length > 0) {
          throw new Error(`Errores de validación: ${erroresValidacion.join(', ')}`);
        }
        
        // Extraer nombre y apellido del autor
        const nombreCompleto = registroNormalizado.Autor.trim();
        let nombrePila = '';
        let apellidoAutor = '';
        
        if (nombreCompleto.includes(' ')) {
          const partes = nombreCompleto.split(' ');
          apellidoAutor = partes.pop();
          nombrePila = partes.join(' ');
        } else {
          apellidoAutor = nombreCompleto;
        }
        
        console.log(`Procesando autor: ${nombrePila} ${apellidoAutor}`);
        
        // Buscar o crear autor
        const [autoresResultado] = await db.sequelize.query(
          `SELECT AutorID FROM Autores WHERE Nombre = N'${nombrePila.replace(/'/g, "''")}' AND Apellido = N'${apellidoAutor.replace(/'/g, "''")}'`
        );
        
        let autorID;
        if (autoresResultado.length > 0) {
          autorID = autoresResultado[0].AutorID;
        } else {
          const [insertResultado] = await db.sequelize.query(
            `INSERT INTO Autores (Nombre, Apellido, FechaCreacion, FechaActualizacion)
             OUTPUT INSERTED.AutorID
             VALUES (N'${nombrePila.replace(/'/g, "''")}', N'${apellidoAutor.replace(/'/g, "''")}', GETDATE(), GETDATE())`
          );
          autorID = insertResultado[0].AutorID;
        }
        
        // Resto del código igual que antes...
        // [Continúa con el resto del procesamiento del registro...]
        
        // Buscar o crear editorial
        const [editorialesResultado] = await db.sequelize.query(
          `SELECT EditorialID FROM Editoriales WHERE Nombre = N'${registroNormalizado.Editorial.replace(/'/g, "''")}'`
        );
        
        let editorialID;
        if (editorialesResultado.length > 0) {
          editorialID = editorialesResultado[0].EditorialID;
        } else {
          const [insertResultado] = await db.sequelize.query(
            `INSERT INTO Editoriales (Nombre, FechaCreacion, FechaActualizacion)
             OUTPUT INSERTED.EditorialID
             VALUES (N'${registroNormalizado.Editorial.replace(/'/g, "''")}', GETDATE(), GETDATE())`
          );
          editorialID = insertResultado[0].EditorialID;
        }
        
        // Formatear la fecha de publicación para SQL Server
        let fechaPublicacionSQL = 'NULL';
        let fechaPublicacion = null;
        if (registroNormalizado.FechaPublicacion && registroNormalizado.FechaPublicacion.trim()) {
          const fecha = parseDate(registroNormalizado.FechaPublicacion);
          if (fecha) {
            fechaPublicacion = fecha.toISOString().split('T')[0];
            fechaPublicacionSQL = `'${fechaPublicacion}'`;
          }
        }
        
        // Preparar datos del libro para creación o actualización
        const paginas = !isNaN(parseInt(registroNormalizado.Paginas, 10)) ? 
                         parseInt(registroNormalizado.Paginas, 10) : 'NULL';
        
        const nuevoDatosLibro = {
          isbn: registroNormalizado.ISBN || '',
          titulo: registroNormalizado.Titulo,
          fechaPublicacion: fechaPublicacion,
          edicion: registroNormalizado.Edicion || '',
          idioma: registroNormalizado.Idioma || 'Español',
          paginas: paginas,
          descripcion: registroNormalizado.Descripcion || ''
        };
        
        // Intentar buscar y actualizar libro existente si se solicita
        let libroID = null;
        if (opciones.actualizar && registroNormalizado.ISBN) {
          libroID = await buscarYActualizarLibro(registroNormalizado.ISBN, { autorID, editorialID }, nuevoDatosLibro);
          
          if (libroID) {
            resultados.actualizados++;
            console.log(`Libro actualizado: ${registroNormalizado.Titulo} (ID: ${libroID})`);
          }
        }
        
        // Si no se actualizó ningún libro existente, crear uno nuevo
        if (!libroID) {
          try {
            console.log('Intentando crear nuevo libro:', registroNormalizado.Titulo);
            
            const queryInsertLibro = `
              INSERT INTO Libros (ISBN, Titulo, AutorID, EditorialID, FechaPublicacion, 
                               Edicion, Idioma, Paginas, Descripcion, FechaCreacion, FechaActualizacion)
              OUTPUT INSERTED.LibroID
              VALUES (N'${registroNormalizado.ISBN || ''}', N'${registroNormalizado.Titulo.replace(/'/g, "''")}', 
                      ${autorID}, ${editorialID}, ${fechaPublicacionSQL},
                      N'${(registroNormalizado.Edicion || '').replace(/'/g, "''")}', 
                      N'${(registroNormalizado.Idioma || 'Español').replace(/'/g, "''")}', 
                      ${paginas}, N'${(registroNormalizado.Descripcion || '').replace(/'/g, "''")}',
                      GETDATE(), GETDATE())`;
            
            // Versión resumida para log
            console.log('Ejecutando inserción de libro...');
            
            const [libroResultado] = await db.sequelize.query(queryInsertLibro);
            
            libroID = libroResultado[0].LibroID;
            console.log(`Nuevo libro creado: ${registroNormalizado.Titulo} (ID: ${libroID})`);
          } catch (insertError) {
            console.error('Error de inserción SQL:', insertError);
            throw new Error(`Error al insertar libro en la base de datos: ${insertError.message}`);
          }
        }
        
        // Procesar categorías
        if (registroNormalizado.Categorias && registroNormalizado.Categorias.trim() !== '') {
          const categorias = registroNormalizado.Categorias.split(';').map(c => c.trim());
          
          for (const nombreCategoria of categorias) {
            if (!nombreCategoria) continue;
            
            // Buscar o crear categoría
            const [categoriasResultado] = await db.sequelize.query(
              `SELECT CategoriaID FROM Categorias WHERE Nombre = N'${nombreCategoria.replace(/'/g, "''")}'`
            );
            
            let categoriaID;
            if (categoriasResultado.length > 0) {
              categoriaID = categoriasResultado[0].CategoriaID;
            } else {
              const [insertResultado] = await db.sequelize.query(
                `INSERT INTO Categorias (Nombre, FechaCreacion, FechaActualizacion)
                 OUTPUT INSERTED.CategoriaID
                 VALUES (N'${nombreCategoria.replace(/'/g, "''")}', GETDATE(), GETDATE())`
              );
              categoriaID = insertResultado[0].CategoriaID;
            }
            
            // Vincular libro y categoría
            await db.sequelize.query(
              `IF NOT EXISTS (SELECT 1 FROM LibroCategorias WHERE LibroID = ${libroID} AND CategoriaID = ${categoriaID})
               INSERT INTO LibroCategorias (LibroID, CategoriaID) VALUES (${libroID}, ${categoriaID})`
            );
          }
        }
        
        // Crear ejemplares solo para libros nuevos o si se especifica
        if (libroID && (!opciones.actualizar || (opciones.actualizar && resultados.actualizados === 0))) {
          const cantidadEjemplares = parseInt(registroNormalizado.Ejemplares, 10) || 1;
          console.log(`Creando ${cantidadEjemplares} ejemplares para el libro ID ${libroID}`);
          
          // Obtener el próximo número de copia
          const [ultimaCopiaResultado] = await db.sequelize.query(
            `SELECT MAX(NumeroCopia) AS UltimaCopia FROM Ejemplares WHERE LibroID = ${libroID}`
          );
          
          const ultimaCopia = ultimaCopiaResultado[0].UltimaCopia || 0;
          
          for (let i = 1; i <= cantidadEjemplares; i++) {
            const numeroCopia = ultimaCopia + i;
            const codigoBarras = `${registroNormalizado.ISBN || 'LIB'}-${libroID}-${numeroCopia}`;
            await db.sequelize.query(
              `INSERT INTO Ejemplares (LibroID, CodigoBarras, NumeroCopia, Estado, FechaCreacion, FechaActualizacion)
               VALUES (${libroID}, N'${codigoBarras}', ${numeroCopia}, 'Disponible', GETDATE(), GETDATE())`
            );
          }
        }
        
        if (!opciones.actualizar || (opciones.actualizar && resultados.actualizados === 0)) {
          resultados.exitosos++;
        }
      } catch (error) {
        console.error(`Error al importar ${registroNormalizado.Titulo}:`, error.message);
        resultados.fallidos++;
        resultados.errores.push({
          libro: registroNormalizado.Titulo || 'Sin título',
          error: error.message
        });
      }
    }
    
    console.log('=== FIN DE IMPORTACIÓN ===');
    console.log(`Resultados: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`);
    
    // Borrar el archivo temporal
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Devolver resultados
    res.send({
      message: "Importación completada",
      resultados
    });
  } catch (err) {
    console.error('Error global de importación:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (fsError) {
        console.error('Error al eliminar archivo temporal:', fsError);
      }
    }
    
    res.status(500).send({
      message: err.message || "Ocurrió un error durante la importación de libros."
    });
  }
};