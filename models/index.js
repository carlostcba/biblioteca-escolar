// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/db.config');

const sequelize = new Sequelize(
  config.database,
  config.user,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    port: config.port,
    dialectOptions: config.options,
    pool: config.pool,
    logging: console.log
  }
);

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