// models/rol.model.js
module.exports = (sequelize, DataTypes) => {
    const Rol = sequelize.define('Rol', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      es_predefinido: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      es_administrativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      nivel_acceso: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      tipo_rol: {
        type: DataTypes.ENUM('sistema', 'biblioteca', 'usuario'),
        defaultValue: 'usuario'
      },
      modulo_principal: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      color: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      icono: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      tableName: 'Roles',
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
    });
  
    return Rol;
  };