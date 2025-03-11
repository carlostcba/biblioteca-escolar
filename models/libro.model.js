// models/libro.model.js
module.exports = (sequelize, DataTypes) => {
    const Libro = sequelize.define('Libro', {
      LibroID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ISBN: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true
      },
      Titulo: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      AutorID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Autores',
          key: 'AutorID'
        }
      },
      EditorialID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Editoriales',
          key: 'EditorialID'
        }
      },
      FechaPublicacion: {
        type: DataTypes.DATE,
        allowNull: true
      },
      Edicion: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      Idioma: {
        type: DataTypes.STRING(50),
        defaultValue: 'Español'
      },
      Paginas: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      Descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      TablaContenido: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ImagenPortada: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      Formato: {
        type: DataTypes.STRING(20),
        defaultValue: 'Impreso',
        validate: {
          isIn: [['Impreso', 'Digital', 'Audiobook', 'Otro']]
        }
      },
      TipoMaterial: {
        type: DataTypes.STRING(20),
        defaultValue: 'Libro',
        validate: {
          isIn: [['Libro', 'Revista', 'Tesis', 'Manual', 'Otro']]
        }
      },
      ClasificacionDewey: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      ClasificacionLCC: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      VisibleEnCatalogo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      tableName: 'Libros',
      timestamps: true,
      createdAt: 'FechaCreacion',
      updatedAt: 'FechaActualizacion'
    });
  
    return Libro;
  };