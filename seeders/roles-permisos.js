// seeders/roles-permisos.js
const db = require('../models');
const Rol = db.Rol;
const Permiso = db.Permiso;

/**
 * Crea los roles y permisos iniciales del sistema
 */
const seedRolesPermisos = async () => {
  try {
    const roles = [
      {
        nombre: 'administrador',
        descripcion: 'Acceso completo a todas las funcionalidades del sistema',
        es_predefinido: true,
        es_administrativo: true,
        nivel_acceso: 10,
        tipo_rol: 'sistema',
        modulo_principal: 'dashboard',
        color: '#e53e3e',
        icono: 'fa-user-shield',
        activo: true
      },
      {
        nombre: 'bibliotecario',
        descripcion: 'Gestión del catálogo y préstamos',
        es_predefinido: true,
        es_administrativo: true,
        nivel_acceso: 8,
        tipo_rol: 'biblioteca',
        modulo_principal: 'libros',
        color: '#3182ce',
        icono: 'fa-book-open',
        activo: true
      },
      {
        nombre: 'docente',
        descripcion: 'Permisos especiales para profesores',
        es_predefinido: true,
        es_administrativo: false,
        nivel_acceso: 5,
        tipo_rol: 'usuario',
        modulo_principal: 'reservas',
        color: '#38a169',
        icono: 'fa-chalkboard-teacher',
        activo: true
      },
      {
        nombre: 'alumno',
        descripcion: 'Acceso básico para estudiantes',
        es_predefinido: true,
        es_administrativo: false,
        nivel_acceso: 1,
        tipo_rol: 'usuario',
        modulo_principal: 'catalogo',
        color: '#805ad5',
        icono: 'fa-user-graduate',
        activo: true
      }
    ];

    // Crear permisos por módulo
    const permisos = [
      // Permisos de usuarios
      {
        nombre: 'ver_usuarios',
        descripcion: 'Ver lista de usuarios',
        modulo: 'usuarios',
        accion: 'ver',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'crear_usuario',
        descripcion: 'Crear nuevo usuario',
        modulo: 'usuarios',
        accion: 'crear',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'editar_usuario',
        descripcion: 'Editar información de usuario',
        modulo: 'usuarios',
        accion: 'editar',
        ambito: 'objeto',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'eliminar_usuario',
        descripcion: 'Eliminar usuario',
        modulo: 'usuarios',
        accion: 'eliminar',
        ambito: 'objeto',
        es_peligroso: true,
        requiere_verificacion_adicional: true,
        activo: true
      },
      {
        nombre: 'gestionar_roles',
        descripcion: 'Asignar y revocar roles',
        modulo: 'usuarios',
        accion: 'gestionar_roles',
        ambito: 'objeto',
        es_peligroso: true,
        requiere_verificacion_adicional: false,
        activo: true
      },
      
      // Permisos de libros
      {
        nombre: 'ver_catalogo',
        descripcion: 'Ver catálogo de libros',
        modulo: 'libros',
        accion: 'ver',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'crear_libro',
        descripcion: 'Crear nuevo libro',
        modulo: 'libros',
        accion: 'crear',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'editar_libro',
        descripcion: 'Editar información de libro',
        modulo: 'libros',
        accion: 'editar',
        ambito: 'objeto',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'eliminar_libro',
        descripcion: 'Eliminar libro',
        modulo: 'libros',
        accion: 'eliminar',
        ambito: 'objeto',
        es_peligroso: true,
        requiere_verificacion_adicional: true,
        activo: true
      },
      {
        nombre: 'importar_libros',
        descripcion: 'Importar libros desde CSV',
        modulo: 'libros',
        accion: 'importar',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      
      // Permisos de ejemplares
      {
        nombre: 'ver_ejemplares',
        descripcion: 'Ver ejemplares de libros',
        modulo: 'ejemplares',
        accion: 'ver',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'crear_ejemplar',
        descripcion: 'Crear nuevo ejemplar',
        modulo: 'ejemplares',
        accion: 'crear',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'editar_ejemplar',
        descripcion: 'Editar información de ejemplar',
        modulo: 'ejemplares',
        accion: 'editar',
        ambito: 'objeto',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'eliminar_ejemplar',
        descripcion: 'Eliminar ejemplar',
        modulo: 'ejemplares',
        accion: 'eliminar',
        ambito: 'objeto',
        es_peligroso: true,
        requiere_verificacion_adicional: false,
        activo: true
      },
      
      // Permisos de préstamos
      {
        nombre: 'ver_prestamos',
        descripcion: 'Ver lista de préstamos',
        modulo: 'prestamos',
        accion: 'ver',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'realizar_prestamo',
        descripcion: 'Realizar nuevo préstamo',
        modulo: 'prestamos',
        accion: 'crear',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'gestionar_prestamo',
        descripcion: 'Gestionar préstamo existente',
        modulo: 'prestamos',
        accion: 'gestionar',
        ambito: 'objeto',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'registrar_devolucion',
        descripcion: 'Registrar devolución de préstamo',
        modulo: 'prestamos',
        accion: 'devolucion',
        ambito: 'objeto',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      
      // Permisos de reservas
      {
        nombre: 'ver_reservas',
        descripcion: 'Ver lista de reservas',
        modulo: 'reservas',
        accion: 'ver',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'realizar_reserva',
        descripcion: 'Realizar nueva reserva',
        modulo: 'reservas',
        accion: 'crear',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'gestionar_reserva',
        descripcion: 'Gestionar reserva existente',
        modulo: 'reservas',
        accion: 'gestionar',
        ambito: 'objeto',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'cancelar_reserva',
        descripcion: 'Cancelar reserva',
        modulo: 'reservas',
        accion: 'cancelar',
        ambito: 'objeto',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      
      // Permisos de reportes
      {
        nombre: 'ver_reportes',
        descripcion: 'Ver reportes',
        modulo: 'reportes',
        accion: 'ver',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'generar_reportes',
        descripcion: 'Generar nuevos reportes',
        modulo: 'reportes',
        accion: 'generar',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'exportar_reportes',
        descripcion: 'Exportar reportes',
        modulo: 'reportes',
        accion: 'exportar',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      
      // Permisos de configuración
      {
        nombre: 'ver_configuracion',
        descripcion: 'Ver configuración del sistema',
        modulo: 'configuracion',
        accion: 'ver',
        ambito: 'modulo',
        es_peligroso: false,
        requiere_verificacion_adicional: false,
        activo: true
      },
      {
        nombre: 'editar_configuracion',
        descripcion: 'Editar configuración del sistema',
        modulo: 'configuracion',
        accion: 'editar',
        ambito: 'modulo',
        es_peligroso: true,
        requiere_verificacion_adicional: true,
        activo: true
      }
    ];

    // Definir permisos por rol
    const rolesPermisos = {
      'administrador': [
        'ver_usuarios', 'crear_usuario', 'editar_usuario', 'eliminar_usuario', 'gestionar_roles',
        'ver_catalogo', 'crear_libro', 'editar_libro', 'eliminar_libro', 'importar_libros',
        'ver_ejemplares', 'crear_ejemplar', 'editar_ejemplar', 'eliminar_ejemplar',
        'ver_prestamos', 'realizar_prestamo', 'gestionar_prestamo', 'registrar_devolucion',
        'ver_reservas', 'realizar_reserva', 'gestionar_reserva', 'cancelar_reserva',
        'ver_reportes', 'generar_reportes', 'exportar_reportes',
        'ver_configuracion', 'editar_configuracion'
      ],
      'bibliotecario': [
        'ver_usuarios', 'crear_usuario', 'editar_usuario',
        'ver_catalogo', 'crear_libro', 'editar_libro', 'importar_libros',
        'ver_ejemplares', 'crear_ejemplar', 'editar_ejemplar',
        'ver_prestamos', 'realizar_prestamo', 'gestionar_prestamo', 'registrar_devolucion',
        'ver_reservas', 'realizar_reserva', 'gestionar_reserva', 'cancelar_reserva',
        'ver_reportes', 'generar_reportes', 'exportar_reportes',
        'ver_configuracion'
      ],
      'docente': [
        'ver_catalogo',
        'ver_ejemplares',
        'realizar_reserva', 'cancelar_reserva',
        'ver_reportes'
      ],
      'alumno': [
        'ver_catalogo',
        'ver_ejemplares',
        'realizar_reserva', 'cancelar_reserva'
      ]
    };

    // Crear roles
    for (const rolData of roles) {
      const [rol, created] = await Rol.findOrCreate({
        where: { nombre: rolData.nombre },
        defaults: rolData
      });
      
      console.log(`Rol ${rolData.nombre} ${created ? 'creado' : 'ya existe'}`);
    }

    // Crear permisos
    for (const permisoData of permisos) {
      const [permiso, created] = await Permiso.findOrCreate({
        where: { nombre: permisoData.nombre },
        defaults: permisoData
      });
      
      console.log(`Permiso ${permisoData.nombre} ${created ? 'creado' : 'ya existe'}`);
    }

    // Asignar permisos a roles
    for (const [rolNombre, permisosArray] of Object.entries(rolesPermisos)) {
      const rol = await Rol.findOne({ where: { nombre: rolNombre } });
      
      if (rol) {
        const permisosRol = await Permiso.findAll({
          where: {
            nombre: permisosArray
          }
        });
        
        await rol.setPermisos(permisosRol);
        console.log(`Asignados ${permisosRol.length} permisos al rol ${rolNombre}`);
      }
    }

    console.log('Roles y permisos inicializados correctamente');
    return true;
  } catch (error) {
    console.error('Error al inicializar roles y permisos:', error);
    return false;
  }
};

module.exports = seedRolesPermisos;