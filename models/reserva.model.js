// models/reserva.model.js
module.exports = (sequelize, DataTypes) => {
    const Reserva = sequelize.define('Reserva', {
      ReservaID: {
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
      UsuarioID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id'
        }
      },
      FechaReserva: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      FechaExpiracion: {
        type: DataTypes.DATE,
        allowNull: false
      },
      Estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
          isIn: [['pendiente', 'lista', 'completada', 'cancelada', 'vencida']]
        }
      },
      EjemplarID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Ejemplares',
          key: 'EjemplarID'
        }
      },
      Notas: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ContadorNotificaciones: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    }, {
      tableName: 'Reservas',
      timestamps: true,
      createdAt: 'FechaCreacion',
      updatedAt: 'FechaActualizacion'
    });
  
    return Reserva;
  };