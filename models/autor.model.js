// models/autor.model.js
module.exports = (sequelize, DataTypes) => {
    const Autor = sequelize.define('Autor', {
      AutorID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      Apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      Biografia: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      FechaNacimiento: {
        type: DataTypes.DATE,
        allowNull: true
      },
      Nacionalidad: {
        type: DataTypes.STRING(50),
        allowNull: true
      }
    }, {
      tableName: 'Autores',
      timestamps: true,
      createdAt: 'FechaCreacion',
      updatedAt: 'FechaActualizacion'
    });
  
    return Autor;
  };