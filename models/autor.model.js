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
    },
    FechaCreacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('GETDATE()') // Usa función nativa de SQL Server
    },
    FechaActualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('GETDATE()') // Usa función nativa de SQL Server
    }
  }, {
    tableName: 'Autores',
    timestamps: false, // Desactivamos el manejo automático de timestamps
    hooks: {
      // Hook para actualizar automáticamente FechaActualizacion al modificar
      beforeUpdate: (autor) => {
        autor.FechaActualizacion = new Date();
      }
    }
  });

  return Autor;
};