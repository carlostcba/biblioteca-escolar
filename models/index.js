// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/db.config');

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    dialect: config.dialect,
    host: config.host,
    dialectOptions: config.dialectOptions,
    define: {
      timestamps: false,
      freezeTableName: true,
      sync: { alter: false, force: false }
    },
    pool: config.pool,
    logging: config.logging
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importar modelos existentes
db.Autor = require('./autor.model')(sequelize, DataTypes);
db.Editorial = require('./editorial.model')(sequelize, DataTypes);
db.Categoria = require('./categoria.model')(sequelize, DataTypes);
db.Libro = require('./libro.model')(sequelize, DataTypes);
db.Ejemplar = require('./ejemplar.model')(sequelize, DataTypes);
db.Reserva = require('./reserva.model')(sequelize, DataTypes);  // Asegúrate de que este modelo esté importado

// Importar nuevos modelos de autenticación
db.Usuario = require('./usuario.model')(sequelize, DataTypes);
db.PerfilEscolar = require('./perfil-escolar.model')(sequelize, DataTypes);
db.Rol = require('./rol.model')(sequelize, DataTypes);
db.Permiso = require('./permiso.model')(sequelize, DataTypes);

// Definir relaciones de los modelos existentes
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

// Relaciones para el modelo de Reserva
// Una reserva pertenece a un libro
db.Reserva.belongsTo(db.Libro, {
  foreignKey: 'LibroID',
  as: 'libro'
});

// Un libro tiene muchas reservas
db.Libro.hasMany(db.Reserva, {
  foreignKey: 'LibroID',
  as: 'reservas'
});

// Una reserva pertenece a un usuario
db.Reserva.belongsTo(db.Usuario, {
  foreignKey: 'UsuarioID',
  as: 'usuario'
});

// Un usuario tiene muchas reservas
db.Usuario.hasMany(db.Reserva, {
  foreignKey: 'UsuarioID',
  as: 'reservas'
});

// Una reserva puede tener un ejemplar asignado
db.Reserva.belongsTo(db.Ejemplar, {
  foreignKey: 'EjemplarID',
  as: 'ejemplar'
});

// Un ejemplar puede tener varias reservas (aunque normalmente sería una a la vez)
db.Ejemplar.hasMany(db.Reserva, {
  foreignKey: 'EjemplarID',
  as: 'reservas'
});

// Definir relaciones para los nuevos modelos de autenticación
// Un usuario tiene un perfil escolar
db.Usuario.hasOne(db.PerfilEscolar, {
  foreignKey: 'usuario_id',
  as: 'perfil'
});

// Un perfil escolar pertenece a un usuario
db.PerfilEscolar.belongsTo(db.Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

// Relación muchos a muchos entre usuarios y roles
db.Usuario.belongsToMany(db.Rol, {
  through: 'UsuarioRoles',
  foreignKey: 'usuario_id',
  otherKey: 'rol_id',
  as: 'roles'
});

db.Rol.belongsToMany(db.Usuario, {
  through: 'UsuarioRoles',
  foreignKey: 'rol_id',
  otherKey: 'usuario_id',
  as: 'usuarios'
});

// Relación muchos a muchos entre roles y permisos
db.Rol.belongsToMany(db.Permiso, {
  through: 'RolPermisos',
  foreignKey: 'rol_id',
  otherKey: 'permiso_id',
  as: 'permisos'
});

db.Permiso.belongsToMany(db.Rol, {
  through: 'RolPermisos',
  foreignKey: 'permiso_id',
  otherKey: 'rol_id',
  as: 'roles'
});

module.exports = db;