// controllers/importar.controller.js
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const db = require('../models');
const { Readable } = require('stream');
const { Transform } = require('stream');

// Modelos
const Autor = db.Autor;
const Editorial = db.Editorial;
const Categoria = db.Categoria;
const Libro = db.Libro;
const Ejemplar = db.Ejemplar;

// Configuración de lotes
const BATCH_SIZE = 100; // Procesar 100 registros a la vez

// Almacén en memoria para el estado de las importaciones
const importacionesEnProceso = new Map();

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
  
  // Validar ISBN (formato básico) - Opcional para este caso
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

// Función para buscar o crear autor
async function buscarOCrearAutor(nombreCompleto) {
  let nombrePila = '';
  let apellidoAutor = '';
  
  if (nombreCompleto.includes(' ')) {
    const partes = nombreCompleto.split(' ');
    apellidoAutor = partes.pop();
    nombrePila = partes.join(' ');
  } else {
    apellidoAutor = nombreCompleto;
  }
  
  // Escapar comillas simples para SQL
  const nombreEscapado = nombrePila.replace(/'/g, "''");
  const apellidoEscapado = apellidoAutor.replace(/'/g, "''");
  
  try {
    // Buscar autor existente
    const [autoresResultado] = await db.sequelize.query(
      `SELECT AutorID FROM Autores WHERE Nombre = N'${nombreEscapado}' AND Apellido = N'${apellidoEscapado}'`
    );
    
    if (autoresResultado.length > 0) {
      return autoresResultado[0].AutorID;
    } else {
      // Crear nuevo autor
      const [insertResultado] = await db.sequelize.query(
        `INSERT INTO Autores (Nombre, Apellido, FechaCreacion, FechaActualizacion)
         OUTPUT INSERTED.AutorID
         VALUES (N'${nombreEscapado}', N'${apellidoEscapado}', GETDATE(), GETDATE())`
      );
      return insertResultado[0].AutorID;
    }
  } catch (error) {
    console.error('Error al buscar/crear autor:', error);
    throw error;
  }
}

// Función para buscar o crear editorial
async function buscarOCrearEditorial(nombreEditorial) {
  const nombreEscapado = nombreEditorial.replace(/'/g, "''");
  
  try {
    // Buscar editorial existente
    const [editorialesResultado] = await db.sequelize.query(
      `SELECT EditorialID FROM Editoriales WHERE Nombre = N'${nombreEscapado}'`
    );
    
    if (editorialesResultado.length > 0) {
      return editorialesResultado[0].EditorialID;
    } else {
      // Crear nueva editorial
      const [insertResultado] = await db.sequelize.query(
        `INSERT INTO Editoriales (Nombre, FechaCreacion, FechaActualizacion)
         OUTPUT INSERTED.EditorialID
         VALUES (N'${nombreEscapado}', GETDATE(), GETDATE())`
      );
      return insertResultado[0].EditorialID;
    }
  } catch (error) {
    console.error('Error al buscar/crear editorial:', error);
    throw error;
  }
}

// Función para buscar o crear categoría
async function buscarOCrearCategoria(nombreCategoria) {
  const nombreEscapado = nombreCategoria.replace(/'/g, "''");
  
  try {
    // Buscar categoría existente
    const [categoriasResultado] = await db.sequelize.query(
      `SELECT CategoriaID FROM Categorias WHERE Nombre = N'${nombreEscapado}'`
    );
    
    if (categoriasResultado.length > 0) {
      return categoriasResultado[0].CategoriaID;
    } else {
      // Crear nueva categoría
      const [insertResultado] = await db.sequelize.query(
        `INSERT INTO Categorias (Nombre, FechaCreacion, FechaActualizacion)
         OUTPUT INSERTED.CategoriaID
         VALUES (N'${nombreEscapado}', GETDATE(), GETDATE())`
      );
      return insertResultado[0].CategoriaID;
    }
  } catch (error) {
    console.error('Error al buscar/crear categoría:', error);
    throw error;
  }
}

// Función para buscar libro por ISBN
async function buscarLibroPorISBN(isbn) {
  if (!isbn) return null;
  
  try {
    const [librosResultado] = await db.sequelize.query(
      `SELECT LibroID FROM Libros WHERE ISBN = N'${isbn}'`
    );
    
    if (librosResultado.length > 0) {
      return librosResultado[0].LibroID;
    }
    return null;
  } catch (error) {
    console.error(`Error al buscar libro con ISBN ${isbn}:`, error);
    return null;
  }
}

// Función para procesar un lote de registros
async function procesarLote(lote, opciones) {
  const resultados = {
    exitosos: 0,
    actualizados: 0,
    fallidos: 0,
    errores: []
  };
  
  // Iniciar transacción
  const t = await db.sequelize.transaction();
  
  try {
    for (const registro of lote) {
      try {
        // Validar datos
        const erroresValidacion = validarDatosLibro(registro);
        if (erroresValidacion.length > 0) {
          throw new Error(`Errores de validación: ${erroresValidacion.join(', ')}`);
        }
        
        // Buscar o crear autor
        const autorID = await buscarOCrearAutor(registro.Autor.trim());
        
        // Buscar o crear editorial
        const editorialID = await buscarOCrearEditorial(registro.Editorial.trim());
        
        // Formatear la fecha de publicación
        let fechaPublicacionSQL = 'NULL';
        let fechaPublicacion = null;
        if (registro.FechaPublicacion && registro.FechaPublicacion.trim()) {
          const fecha = parseDate(registro.FechaPublicacion);
          if (fecha) {
            fechaPublicacion = fecha.toISOString().split('T')[0];
            fechaPublicacionSQL = `'${fechaPublicacion}'`;
          }
        }
        
        // Preparar datos del libro
        const paginas = !isNaN(parseInt(registro.Paginas, 10)) ? 
                         parseInt(registro.Paginas, 10) : 'NULL';
        
        const tituloEscapado = registro.Titulo.replace(/'/g, "''");
        const edicionEscapada = (registro.Edicion || '').replace(/'/g, "''");
        const idiomaEscapado = (registro.Idioma || 'Español').replace(/'/g, "''");
        const descripcionEscapada = (registro.Descripcion || '').replace(/'/g, "''");
        
        // Intentar buscar libro existente si tiene ISBN
        let libroID = null;
        if (opciones.actualizar && registro.ISBN) {
          libroID = await buscarLibroPorISBN(registro.ISBN);
          
          if (libroID) {
            // Actualizar libro existente
            await db.sequelize.query(`
              UPDATE Libros 
              SET Titulo = N'${tituloEscapado}',
                  AutorID = ${autorID},
                  EditorialID = ${editorialID},
                  FechaPublicacion = ${fechaPublicacionSQL},
                  Edicion = N'${edicionEscapada}',
                  Idioma = N'${idiomaEscapado}',
                  Paginas = ${paginas},
                  Descripcion = N'${descripcionEscapada}',
                  FechaActualizacion = GETDATE()
              WHERE LibroID = ${libroID}
            `, { transaction: t });
            
            resultados.actualizados++;
          }
        }
        
        // Si no se actualizó libro existente, crear uno nuevo
        if (!libroID) {
          const [libroResultado] = await db.sequelize.query(`
            INSERT INTO Libros (ISBN, Titulo, AutorID, EditorialID, FechaPublicacion, 
                             Edicion, Idioma, Paginas, Descripcion, FechaCreacion, FechaActualizacion)
            OUTPUT INSERTED.LibroID
            VALUES (N'${registro.ISBN || ''}', N'${tituloEscapado}', 
                    ${autorID}, ${editorialID}, ${fechaPublicacionSQL},
                    N'${edicionEscapada}', 
                    N'${idiomaEscapado}', 
                    ${paginas}, N'${descripcionEscapada}',
                    GETDATE(), GETDATE())
          `, { transaction: t });
          
          libroID = libroResultado[0].LibroID;
          resultados.exitosos++;
        }
        
        // Procesar categorías
        if (registro.Categorias && registro.Categorias.trim() !== '') {
          const categorias = registro.Categorias.split(';').map(c => c.trim());
          
          for (const nombreCategoria of categorias) {
            if (!nombreCategoria) continue;
            
            const categoriaID = await buscarOCrearCategoria(nombreCategoria);
            
            // Vincular libro y categoría
            await db.sequelize.query(
              `IF NOT EXISTS (SELECT 1 FROM LibroCategorias WHERE LibroID = ${libroID} AND CategoriaID = ${categoriaID})
               INSERT INTO LibroCategorias (LibroID, CategoriaID) VALUES (${libroID}, ${categoriaID})`,
              { transaction: t }
            );
          }
        }
        
        // Crear ejemplares
        const cantidadEjemplares = parseInt(registro.Ejemplares, 10) || 1;
        
        // Obtener el próximo número de copia
        const [ultimaCopiaResultado] = await db.sequelize.query(
          `SELECT MAX(NumeroCopia) AS UltimaCopia FROM Ejemplares WHERE LibroID = ${libroID}`,
          { transaction: t }
        );
        
        const ultimaCopia = ultimaCopiaResultado[0].UltimaCopia || 0;
        
        for (let i = 1; i <= cantidadEjemplares; i++) {
          const numeroCopia = ultimaCopia + i;
          const codigoBarras = `${registro.ISBN || 'LIB'}-${libroID}-${numeroCopia}`;
          await db.sequelize.query(
            `INSERT INTO Ejemplares (LibroID, CodigoBarras, NumeroCopia, Estado, FechaCreacion, FechaActualizacion)
             VALUES (${libroID}, N'${codigoBarras}', ${numeroCopia}, 'Disponible', GETDATE(), GETDATE())`,
            { transaction: t }
          );
        }
        
      } catch (error) {
        resultados.fallidos++;
        resultados.errores.push({
          libro: registro.Titulo || 'Sin título',
          error: error.message
        });
        // No interrumpimos el lote, seguimos con el siguiente registro
      }
    }
    
    // Confirmar transacción
    await t.commit();
    return resultados;
    
  } catch (error) {
    // Revertir transacción en caso de error
    await t.rollback();
    throw error;
  }
}

// Función para detectar el separador del CSV
function detectarSeparador(primeraLinea) {
  if (primeraLinea.includes(';')) return ';';
  if (primeraLinea.includes(',')) return ',';
  if (primeraLinea.includes('\t')) return '\t';
  return ','; // por defecto
}

// Función para procesar CSV como stream
function procesarCSVStream(readStream, separador, opciones, callback) {
  let encabezadosDetectados = false;
  let encabezados = [];
  let loteActual = [];
  let totalProcesados = 0;
  let totalRegistros = 0;
  
  const resultadosGlobales = {
    total: 0,
    exitosos: 0,
    actualizados: 0,
    fallidos: 0,
    errores: [],
    progreso: 0
  };

  // Crear un transform stream para normalizar las filas CSV
  const normalizarStream = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const registro = {};
      
      if (!encabezadosDetectados) {
        encabezadosDetectados = true;
        encabezados = Object.keys(chunk);
        totalRegistros = 1; // Inicialmente 1, se actualizará después
      }
      
      // Normalizar nombres de campos
      encabezados.forEach(campo => {
        let nombreCampo = campo;
        // Convertir a formato esperado (primera letra mayúscula)
        if (campo.toLowerCase() === 'isbn') nombreCampo = 'ISBN';
        else if (campo.toLowerCase() === 'titulo') nombreCampo = 'Titulo';
        else if (campo.toLowerCase() === 'autor') nombreCampo = 'Autor';
        else if (campo.toLowerCase() === 'editorial') nombreCampo = 'Editorial';
        else if (campo.toLowerCase() === 'fechapublicacion') nombreCampo = 'FechaPublicacion';
        else if (campo.toLowerCase() === 'edicion') nombreCampo = 'Edicion';
        else if (campo.toLowerCase() === 'idioma') nombreCampo = 'Idioma';
        else if (campo.toLowerCase() === 'paginas') nombreCampo = 'Paginas';
        else if (campo.toLowerCase() === 'descripcion') nombreCampo = 'Descripcion';
        else if (campo.toLowerCase() === 'categorias') nombreCampo = 'Categorias';
        else if (campo.toLowerCase() === 'ejemplares') nombreCampo = 'Ejemplares';
        
        registro[nombreCampo] = chunk[campo];
      });
      
      // Saltar la fila si parece que es de encabezados
      if (
        (registro.ISBN === 'ISBN' && registro.Titulo === 'Titulo') ||
        (registro.Titulo && registro.Titulo.toLowerCase() === 'titulo' && registro.Autor && registro.Autor.toLowerCase() === 'autor')
      ) {
        callback(null);
        return;
      }
      
      // Asegurarse de que todos los campos existan
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
      
      this.push(registroNormalizado);
      callback();
    }
  });
  
  // Crear stream de procesamiento por lotes
  const procesarLoteStream = new Transform({
    objectMode: true,
    transform(registro, encoding, callback) {
      loteActual.push(registro);
      totalRegistros++;
      
      // Cuando el lote actual alcanza el tamaño configurado, procesarlo
      if (loteActual.length >= BATCH_SIZE) {
        const loteParaProcesar = [...loteActual];
        loteActual = [];
        
        procesarLote(loteParaProcesar, opciones)
          .then(resultadosLote => {
            totalProcesados += loteParaProcesar.length;
            
            // Actualizar resultados globales
            resultadosGlobales.exitosos += resultadosLote.exitosos;
            resultadosGlobales.actualizados += resultadosLote.actualizados;
            resultadosGlobales.fallidos += resultadosLote.fallidos;
            resultadosGlobales.errores = resultadosGlobales.errores.concat(resultadosLote.errores);
            resultadosGlobales.total = totalRegistros;
            resultadosGlobales.progreso = Math.floor((totalProcesados / totalRegistros) * 100);
            
            // Informar progreso
            callback(null, resultadosGlobales);
          })
          .catch(error => {
            callback(error);
          });
      } else {
        callback(null);
      }
    },
    // Procesar el último lote cuando se cierra el stream
    flush(callback) {
      if (loteActual.length > 0) {
        procesarLote(loteActual, opciones)
          .then(resultadosLote => {
            totalProcesados += loteActual.length;
            
            // Actualizar resultados globales
            resultadosGlobales.exitosos += resultadosLote.exitosos;
            resultadosGlobales.actualizados += resultadosLote.actualizados;
            resultadosGlobales.fallidos += resultadosLote.fallidos;
            resultadosGlobales.errores = resultadosGlobales.errores.concat(resultadosLote.errores);
            resultadosGlobales.total = totalRegistros;
            resultadosGlobales.progreso = 100; // Completado
            
            // Informar el resultado final
            callback(null, resultadosGlobales);
          })
          .catch(error => {
            callback(error);
          });
      } else {
        callback(null, resultadosGlobales);
      }
    }
  });
  
  // Variable para almacenar las actualizaciones de progreso
  let ultimosResultados = null;
  
  // Conectar los streams
  readStream
    .pipe(csv({ separator: separador }))
    .pipe(normalizarStream)
    .pipe(procesarLoteStream)
    .on('data', (resultados) => {
      ultimosResultados = { ...resultados };
      // Reportar progreso al callback
      callback(null, { ...resultados, completado: false });
    })
    .on('end', () => {
      // Reportar finalización al callback
      if (ultimosResultados) {
        callback(null, { ...ultimosResultados, progreso: 100, completado: true });
      } else {
        callback(null, { 
          total: totalRegistros, 
          exitosos: 0, 
          actualizados: 0, 
          fallidos: 0, 
          errores: [],
          progreso: 100, 
          completado: true 
        });
      }
    })
    .on('error', (error) => {
      callback(error);
    });
}

// Función principal de importación
exports.importarLibros = async (req, res) => {
  // ID único para esta importación (para seguimiento)
  const importID = Date.now().toString();
  
  try {
    // Validar archivo
    if (!req.file) {
      return res.status(400).send({
        message: "Por favor, seleccione un archivo CSV para importar."
      });
    }
    
    console.log(`=== INICIO DE IMPORTACIÓN [${importID}] ===`);
    console.log('Archivo recibido:', req.file.originalname);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(req.file.path)) {
      return res.status(400).send({
        message: "No se pudo acceder al archivo cargado."
      });
    }
    
    // Leer las primeras líneas para detectar el separador
    const fileBuffer = fs.readFileSync(req.file.path, { encoding: 'utf8', flag: 'r' });
    const primerasLineas = fileBuffer.split('\n', 2);
    
    if (primerasLineas.length < 1) {
      return res.status(400).send({
        message: "El archivo CSV está vacío."
      });
    }
    
    // Detectar el separador
    const separador = detectarSeparador(primerasLineas[0]);
    console.log(`Separador detectado: "${separador}"`);
    
    // Configuración de importación
    const opciones = {
      actualizar: req.body.actualizar === 'true',
      mapeo: req.body.mapeo ? JSON.parse(req.body.mapeo) : null
    };
    
    // Inicializar el estado de la importación
    importacionesEnProceso.set(importID, {
      estado: "en_proceso",
      progreso: 0,
      resultados: {
        total: 0,
        exitosos: 0,
        fallidos: 0,
        errores: []
      }
    });
    
    // Enviar respuesta inicial con ID de importación
    res.status(202).send({
      message: "Importación iniciada",
      importID: importID,
      estado: "en_proceso",
      progreso: 0
    });
    
    // Crear stream de lectura para el archivo
    const readStream = fs.createReadStream(req.file.path, { encoding: 'utf8' });
    
    // Procesar el CSV como stream
    procesarCSVStream(readStream, separador, opciones, async (error, resultados) => {
      if (error) {
        console.error(`Error [${importID}]:`, error);
        // Guardar el error en el estado
        importacionesEnProceso.set(importID, { 
          error: error.message,
          estado: "error",
          progreso: 0,
          resultados: { total: 0, exitosos: 0, fallidos: 0, errores: [] }
        });
      } else {
        // Guardar el progreso actual
        importacionesEnProceso.set(importID, {
          estado: resultados.completado ? "completado" : "en_proceso",
          progreso: resultados.progreso,
          resultados: {
            total: resultados.total,
            exitosos: resultados.exitosos + resultados.actualizados,
            fallidos: resultados.fallidos,
            errores: resultados.errores
          }
        });
        
        console.log(`Progreso [${importID}]: ${resultados.progreso}%, Procesados: ${resultados.exitosos + resultados.actualizados + resultados.fallidos}/${resultados.total}`);
        
        // Si la importación está completa, hacer limpieza
        if (resultados.completado) {
          console.log(`=== FIN DE IMPORTACIÓN [${importID}] ===`);
          console.log(`Resultados: ${resultados.exitosos} exitosos, ${resultados.actualizados} actualizados, ${resultados.fallidos} fallidos de ${resultados.total} total`);
          
          // Borrar el archivo temporal
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          
          // Planificar la eliminación del estado después de 30 minutos
          setTimeout(() => {
            importacionesEnProceso.delete(importID);
          }, 30 * 60 * 1000);
        }
      }
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
    
    // Si aún no se ha enviado respuesta
    if (!res.headersSent) {
      res.status(500).send({
        message: err.message || "Ocurrió un error durante la importación de libros."
      });
    }
  }
};

// Endpoint para verificar estado de importación
exports.verificarEstadoImportacion = async (req, res) => {
  const { importID } = req.params;
  
  try {
    // Obtener el estado de la importación
    const estadoImportacion = importacionesEnProceso.get(importID);
    
    if (!estadoImportacion) {
      return res.status(404).send({
        message: "No se encontró información sobre la importación solicitada."
      });
    }
    
    res.status(200).send({
      importID,
      estado: estadoImportacion.estado,
      progreso: estadoImportacion.progreso,
      resultados: estadoImportacion.resultados
    });
  } catch (error) {
    res.status(500).send({
      message: "Error al verificar el estado de la importación."
    });
  }
};

// Endpoint para listar importaciones recientes
exports.listarImportacionesRecientes = async (req, res) => {
  try {
    // Convertir Map a Array para enviar como respuesta
    const importaciones = Array.from(importacionesEnProceso.entries()).map(([id, data]) => {
      return {
        id,
        estado: data.estado,
        progreso: data.progreso,
        total: data.resultados.total,
        exitosos: data.resultados.exitosos,
        fallidos: data.resultados.fallidos,
        timestamp: id // El ID es el timestamp
      };
    });
    
    // Ordenar por timestamp (más reciente primero)
    importaciones.sort((a, b) => b.timestamp - a.timestamp);
    
    res.status(200).send({
      total: importaciones.length,
      importaciones: importaciones.slice(0, 10) // Mostrar solo las 10 más recientes
    });
  } catch (error) {
    res.status(500).send({
      message: "Error al listar importaciones recientes."
    });
  }
};