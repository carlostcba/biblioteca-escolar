// models/editorial.model.js
module.exports = (sequelize, DataTypes) => {
    const Editorial = sequelize.define('Editorial', {
      EditorialID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      Direccion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      Telefono: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      Email: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      SitioWeb: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    }, {
      tableName: 'Editoriales',
      timestamps: true,
      createdAt: 'FechaCreacion',
      updatedAt: 'FechaActualizacion'
    });
  
    return Editorial;
  };