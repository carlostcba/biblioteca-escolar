// controllers/exportar.controller.js
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const db = require('../models');

exports.exportarLibros = async (req, res) => {
  try {
    const { formato = 'csv', filtro = {} } = req.query;
    
    // Construir consulta SQL con filtros
    let condicion = "";
    const params = [];
    
    if (filtro.titulo) {
      condicion += " AND l.Titulo LIKE ? ";
      params.push(`%${filtro.titulo}%`);
    }
    
    if (filtro.autor) {
      condicion += " AND (a.Nombre LIKE ? OR a.Apellido LIKE ?) ";
      params.push(`%${filtro.autor}%`);
      params.push(`%${filtro.autor}%`);
    }
    
    if (filtro.categoria) {
      condicion += " AND c.Nombre = ? ";
      params.push(filtro.categoria);
    }
    
    // Consultar libros con todos sus datos relacionados
    const [libros] = await db.sequelize.query(`
      SELECT 
        l.ISBN, 
        l.Titulo, 
        CONCAT(a.Nombre, ' ', a.Apellido) AS Autor,
        e.Nombre AS Editorial,
        l.FechaPublicacion,
        l.Edicion,
        l.Idioma,
        l.Paginas,
        l.Descripcion,
        (
          SELECT STRING_AGG(c.Nombre, ';') 
          FROM Categorias c
          JOIN LibroCategorias lc ON c.CategoriaID = lc.CategoriaID
          WHERE lc.LibroID = l.LibroID
        ) AS Categorias,
        (
          SELECT COUNT(ej.EjemplarID)
          FROM Ejemplares ej
          WHERE ej.LibroID = l.LibroID
        ) AS Ejemplares
      FROM Libros l
      JOIN Autores a ON l.AutorID = a.AutorID
      JOIN Editoriales e ON l.EditorialID = e.EditorialID
      WHERE 1=1 ${condicion}
      GROUP BY l.LibroID, l.ISBN, l.Titulo, a.Nombre, a.Apellido, e.Nombre, 
               l.FechaPublicacion, l.Edicion, l.Idioma, l.Paginas, l.Descripcion
    `, { replacements: params });
    
    if (libros.length === 0) {
      return res.status(404).send({
        message: "No se encontraron libros para exportar."
      });
    }
    
    // Exportar según formato
    if (formato === 'csv') {
      // Configurar la transformación a CSV
      const campos = ['ISBN', 'Titulo', 'Autor', 'Editorial', 'FechaPublicacion', 'Edicion', 
                      'Idioma', 'Paginas', 'Descripcion', 'Categorias', 'Ejemplares'];
      const json2csvParser = new Parser({ fields: campos });
      const csv = json2csvParser.parse(libros);
      
      // Configurar cabeceras y enviar archivo
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=libros.csv');
      res.status(200).send(csv);
    } else if (formato === 'json') {
      res.json(libros);
    } else {
      res.status(400).send({
        message: "Formato no soportado. Use 'csv' o 'json'."
      });
    }
  } catch (err) {
    console.error("Error al exportar libros:", err);
    res.status(500).send({
      message: err.message || "Ocurrió un error durante la exportación de libros."
    });
  }
};