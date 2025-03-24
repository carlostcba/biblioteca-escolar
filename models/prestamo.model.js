// models/prestamo.model.js
module.exports = (sequelize, DataTypes) => {
    const Prestamo = sequelize.define('Prestamo', {
      PrestamoID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      EjemplarID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Ejemplares',
          key: 'EjemplarID'
        }
      },
      UsuarioID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id'
        }
      },
      FechaPrestamo: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      FechaDevolucion: {
        type: DataTypes.DATE,
        allowNull: false
      },
      FechaDevolucionReal: {
        type: DataTypes.DATE,
        allowNull: true
      },
      Estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'activo',
        validate: {
          isIn: [['activo', 'vencido', 'devuelto', 'perdido', 'dañado']]
        }
      },
      Renovaciones: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      Notas: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      MultaImporte: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      MultaPagada: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      BibliotecarioID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Usuarios',
          key: 'id'
        }
      },
      BibliotecarioDevolucionID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Usuarios',
          key: 'id'
        }
      }
    }, {
      tableName: 'Prestamos',
      timestamps: true,
      createdAt: 'FechaCreacion',
      updatedAt: 'FechaActualizacion'
    });
  
    return Prestamo;
  };