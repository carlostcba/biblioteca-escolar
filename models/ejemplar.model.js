// models/ejemplar.model.js
module.exports = (sequelize, DataTypes) => {
    const Ejemplar = sequelize.define('Ejemplar', {
      EjemplarID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      LibroID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Libros',
          key: 'LibroID'
        }
      },
      CodigoBarras: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      Signatura: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      NumeroCopia: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      Estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Disponible',
        validate: {
          isIn: [['Disponible', 'Prestado', 'Reservado', 'EnTransito', 'EnCuarentena', 'EnReparacion', 'Extraviado', 'Retirado']]
        }
      },
      Notas: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      FechaAdquisicion: {
        type: DataTypes.DATE,
        allowNull: true
      },
      Condicion: {
        type: DataTypes.STRING(20),
        defaultValue: 'Bueno',
        validate: {
          isIn: [['Nuevo', 'Bueno', 'Regular', 'Deteriorado', 'MuyDeteriorado']]
        }
      }
    }, {
      tableName: 'Ejemplares',
      timestamps: true,
      createdAt: 'FechaCreacion',
      updatedAt: 'FechaActualizacion'
    });
  
    return Ejemplar;
  };