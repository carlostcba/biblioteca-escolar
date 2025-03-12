// models/perfil-escolar.model.js
module.exports = (sequelize, DataTypes) => {
    const PerfilEscolar = sequelize.define('PerfilEscolar', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Usuarios',
          key: 'id'
        }
      },
      tipo_perfil: {
        type: DataTypes.ENUM('alumno', 'docente'),
        allowNull: false
      },
      // Campos para alumnos
      nivel_educativo: {
        type: DataTypes.ENUM('primaria', 'secundaria_basica', 'secundaria_tecnica'),
        allowNull: true
      },
      grado: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 12
        }
      },
      grupo: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      turno: {
        type: DataTypes.ENUM('matutino', 'vespertino', 'tiempo_completo'),
        allowNull: true
      },
      matricula: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      
      // Campos para docentes
      departamento: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      codigo_empleado: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      asignaturas: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('asignaturas');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('asignaturas', JSON.stringify(value));
        }
      }
    }, {
      tableName: 'PerfilesEscolares',
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
    });
  
    return PerfilEscolar;
  };