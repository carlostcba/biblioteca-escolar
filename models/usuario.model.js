// models/usuario.model.js
module.exports = (sequelize, DataTypes) => {
    const Usuario = sequelize.define('Usuario', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      tipo_usuario: {
        type: DataTypes.ENUM('administrador', 'bibliotecario', 'docente', 'alumno', 'personal'),
        defaultValue: 'alumno'
      },
      estado: {
        type: DataTypes.ENUM('activo', 'inactivo', 'suspendido'),
        defaultValue: 'activo'
      },
      ultima_conexion: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      tableName: 'Usuarios',
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
    });
  
    return Usuario;
  };