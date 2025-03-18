// controllers/perfil.controller.js
const db = require('../models');
const Usuario = db.Usuario;
const PerfilEscolar = db.PerfilEscolar;
const Prestamo = db.Prestamo;
const Reserva = db.Reserva;

// Obtener perfil del usuario actual
exports.obtenerPerfil = async (req, res) => {
    try {
        const usuarioId = req.userId; // Proporcionado por el middleware de autenticación
        
        const usuario = await Usuario.findByPk(usuarioId, {
            attributes: ['id', 'nombre', 'apellido', 'email', 'tipo_usuario'],
            include: [{
                model: PerfilEscolar,
                as: 'perfil',
                attributes: [
                    'nivel_educativo', 'grado', 'grupo', 'turno', 'matricula',
                    'departamento', 'codigo_empleado', 'asignaturas'
                ]
            }]
        });
        
        if (!usuario) {
            return res.status(404).send({
                message: "Usuario no encontrado."
            });
        }
        
        res.status(200).send(usuario);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).send({
            message: error.message || "Error al recuperar datos del perfil."
        });
    }
};

// Actualizar perfil del usuario
exports.actualizarPerfil = async (req, res) => {
    try {
        const usuarioId = req.userId;
        const { nombre, apellido } = req.body;
        
        // Validar datos
        if (!nombre || !apellido) {
            return res.status(400).send({
                message: "El nombre y apellido son obligatorios."
            });
        }
        
        // Actualizar datos básicos del usuario
        const [numUpdated] = await Usuario.update(
            { nombre, apellido },
            { where: { id: usuarioId } }
        );
        
        if (numUpdated !== 1) {
            return res.status(404).send({
                message: "No se pudo actualizar el perfil."
            });
        }
        
        res.status(200).send({
            message: "Perfil actualizado correctamente."
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).send({
            message: error.message || "Error al actualizar el perfil."
        });
    }
};

// Obtener historial de actividad
exports.obtenerActividad = async (req, res) => {
    try {
        const usuarioId = req.userId;
        
        // Obtener préstamos
        const prestamos = await Prestamo.findAll({
            where: { usuario_id: usuarioId },
            include: [{
                model: db.Ejemplar,
                as: 'ejemplar',
                include: [{
                    model: db.Libro,
                    as: 'libro'
                }]
            }],
            order: [['fecha_prestamo', 'DESC']],
            limit: 10
        });
        
        // Obtener reservas
        const reservas = await Reserva.findAll({
            where: { usuario_id: usuarioId },
            include: [{
                model: db.Libro,
                as: 'libro'
            }],
            order: [['fecha_reserva', 'DESC']],
            limit: 10
        });
        
        // Contar totales
        const totalPrestamos = await Prestamo.count({
            where: { usuario_id: usuarioId }
        });
        
        const totalReservas = await Reserva.count({
            where: { usuario_id: usuarioId }
        });
        
        // Crear lista de actividad reciente
        const actividadReciente = [];
        
        // Añadir préstamos a la actividad
        prestamos.forEach(prestamo => {
            actividadReciente.push({
                id: `prestamo-${prestamo.id}`,
                tipo: 'prestamo',
                titulo: 'Préstamo',
                descripcion: `"${prestamo.ejemplar.libro.titulo}"`,
                fecha: prestamo.fecha_prestamo
            });
            
            // Si hay devolución, añadirla también
            if (prestamo.fecha_devolucion) {
                actividadReciente.push({
                    id: `devolucion-${prestamo.id}`,
                    tipo: 'devolucion',
                    titulo: 'Devolución',
                    descripcion: `"${prestamo.ejemplar.libro.titulo}"`,
                    fecha: prestamo.fecha_devolucion
                });
            }
        });
        
        // Añadir reservas a la actividad
        reservas.forEach(reserva => {
            actividadReciente.push({
                id: `reserva-${reserva.id}`,
                tipo: 'reserva',
                titulo: 'Reserva',
                descripcion: `"${reserva.libro.titulo}"`,
                fecha: reserva.fecha_reserva
            });
        });
        
        // Ordenar por fecha más reciente
        actividadReciente.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        // Limitar a 10 elementos más recientes
        const recienteRecortado = actividadReciente.slice(0, 10);
        
        // Preparar respuesta
        const respuesta = {
            totalPrestamos,
            totalReservas,
            totalFavoritos: 0, // Implementar si hay funcionalidad de favoritos
            reciente: recienteRecortado
        };
        
        res.status(200).send(respuesta);
    } catch (error) {
        console.error('Error al obtener actividad:', error);
        res.status(500).send({
            message: error.message || "Error al recuperar historial de actividad."
        });
    }
};