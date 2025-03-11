// models/categoria.model.js
module.exports = (sequelize, DataTypes) => {
    const Categoria = sequelize.define('Categoria', {
      CategoriaID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Nombre: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      Descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      tableName: 'Categorias',
      timestamps: true,
      createdAt: 'FechaCreacion',
      updatedAt: 'FechaActualizacion'
    });
  
    return Categoria;
  };