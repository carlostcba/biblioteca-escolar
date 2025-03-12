// models/permiso.model.js
module.exports = (sequelize, DataTypes) => {
    const Permiso = sequelize.define('Permiso', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      modulo: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      accion: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      ambito: {
        type: DataTypes.ENUM('sistema', 'modulo', 'objeto', 'propio'),
        defaultValue: 'objeto'
      },
      es_peligroso: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      requiere_verificacion_adicional: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      tableName: 'Permisos',
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
    });
  
    return Permiso;
  };