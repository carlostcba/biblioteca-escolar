// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/db.config');

const sequelize = new Sequelize('BibliotecaEscolar', 'sa', 'LaSalle2599', {
  dialect: 'mssql',
  host: 'localhost',
  dialectOptions: {
    options: {
      instanceName: 'SQLEXPRESS',
      encrypt: false,
      trustServerCertificate: false,
      connectTimeout: 30000
      // Quitar la configuración de isolationLevel que causa el error
    }
  },
  // Quitar transactionType e isolationLevel
  define: {
    // Configuración global para todos los modelos
    timestamps: false, // Desactivamos el manejo automático de timestamps
    freezeTableName: true, // Evita la pluralización automática de nombres de tabla
    // No intentar alterar las tablas existentes
    sync: { alter: false, force: false }
  },
  // Configuración de pool de conexiones
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Menos logs para tener más limpia la consola
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importar modelos
db.Autor = require('./autor.model')(sequelize, DataTypes);
db.Editorial = require('./editorial.model')(sequelize, DataTypes);
db.Categoria = require('./categoria.model')(sequelize, DataTypes);
db.Libro = require('./libro.model')(sequelize, DataTypes);
db.Ejemplar = require('./ejemplar.model')(sequelize, DataTypes);

// Definir relaciones

// Un libro pertenece a un autor
db.Libro.belongsTo(db.Autor, {
  foreignKey: 'AutorID',
  as: 'autor'
});

// Un autor tiene muchos libros
db.Autor.hasMany(db.Libro, {
  foreignKey: 'AutorID',
  as: 'libros'
});

// Un libro pertenece a una editorial
db.Libro.belongsTo(db.Editorial, {
  foreignKey: 'EditorialID',
  as: 'editorial'
});

// Una editorial tiene muchos libros
db.Editorial.hasMany(db.Libro, {
  foreignKey: 'EditorialID',
  as: 'libros'
});

// Un libro tiene muchas categorías (muchos a muchos)
db.Libro.belongsToMany(db.Categoria, {
  through: 'LibroCategorias',
  foreignKey: 'LibroID',
  otherKey: 'CategoriaID',
  as: 'categorias'
});

// Una categoría tiene muchos libros (muchos a muchos)
db.Categoria.belongsToMany(db.Libro, {
  through: 'LibroCategorias',
  foreignKey: 'CategoriaID',
  otherKey: 'LibroID',
  as: 'libros'
});

// Un libro tiene muchos ejemplares
db.Libro.hasMany(db.Ejemplar, {
  foreignKey: 'LibroID',
  as: 'ejemplares'
});

// Un ejemplar pertenece a un libro
db.Ejemplar.belongsTo(db.Libro, {
  foreignKey: 'LibroID',
  as: 'libro'
});

module.exports = db;