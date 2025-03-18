// js/perfil.js
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info') ? JSON.parse(localStorage.getItem('user_info')) : null;
    
    if (!token || !userInfo) {
        window.location.href = '/login.html';
        return;
    }
    
    // Elementos DOM
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const formPerfil = document.getElementById('form-perfil');
    const formPassword = document.getElementById('form-password');
    const perfilNombreCompleto = document.getElementById('perfil-nombre-completo');
    const perfilTipoUsuario = document.getElementById('perfil-tipo-usuario');
    const perfilEmail = document.getElementById('perfil-email');
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const emailInput = document.getElementById('email');
    
    // Contenedores específicos según tipo de usuario
    const infoAlumno = document.getElementById('info-alumno');
    const infoDocente = document.getElementById('info-docente');
    
    // Cargar datos del perfil
    cargarDatosPerfil();
    
    // Event Listeners para las pestañas
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            cambiarTab(tabId);
        });
    });
    
    // Event Listeners para los formularios
    if (formPerfil) {
        formPerfil.addEventListener('submit', actualizarPerfil);
    }
    
    if (formPassword) {
        formPassword.addEventListener('submit', cambiarPassword);
    }
    
    /**
     * Carga los datos del perfil del usuario actual
     */
    async function cargarDatosPerfil() {
        try {
            // Cambiado a la ruta correcta
            const response = await fetch('/api/usuarios/mi-perfil', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar datos del perfil');
            }
            
            const data = await response.json();
            console.log("Datos de perfil recibidos:", data); // Para depuración
            
            // Actualizar información básica en la UI
            if (perfilNombreCompleto) perfilNombreCompleto.textContent = `${data.nombre} ${data.apellido}`;
            if (perfilTipoUsuario) perfilTipoUsuario.textContent = primeraLetraMayuscula(data.tipo_usuario);
            if (perfilEmail) perfilEmail.textContent = data.email;
            
            // Llenar formulario de información personal
            if (nombreInput) nombreInput.value = data.nombre;
            if (apellidoInput) apellidoInput.value = data.apellido;
            if (emailInput) emailInput.value = data.email;
            
            // Actualizar nombre en el menú de usuario
            const userName = document.getElementById('user-name');
            if (userName) {
                userName.textContent = `${data.nombre} ${data.apellido}`;
            }
            
            // Mostrar información específica según tipo de usuario
            mostrarInfoEspecifica(data);
            
            // Cargar datos de actividad si están disponibles
            if (data.actividad) {
                actualizarEstadisticasActividad(data.actividad);
            } else {
                // Cargar historial de actividad por separado si no viene incluido
                cargarHistorialActividad();
            }
            
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            mostrarNotificacion('Error al cargar datos del perfil', 'error');
        }
    }
    
    /**
     * Carga el historial de actividad del usuario
     */
    async function cargarHistorialActividad() {
        try {
            const response = await fetch('/api/usuarios/actividad', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar historial de actividad');
            }
            
            const actividad = await response.json();
            actualizarEstadisticasActividad(actividad);
            
        } catch (error) {
            console.error('Error al cargar actividad:', error);
            // No mostramos notificación para no sobrecargar al usuario con mensajes de error
        }
    }
    
    /**
     * Muestra información específica según el tipo de usuario
     * @param {Object} data - Datos del perfil
     */
    function mostrarInfoEspecifica(data) {
        // Ocultar todos los contenedores de información específica
        if (infoAlumno) infoAlumno.classList.add('hidden');
        if (infoDocente) infoDocente.classList.add('hidden');
        
        // Verificar si existe información de perfil
        if (!data.perfil) {
            console.warn('No se encontró información de perfil escolar');
            return;
        }
        
        console.log("Mostrando información específica para:", data.tipo_usuario);
        console.log("Datos de perfil:", data.perfil);
        
        // Mostrar contenedor según tipo de usuario
        if (data.tipo_usuario === 'alumno' && infoAlumno) {
            infoAlumno.classList.remove('hidden');
            
            // Llenar campos de alumno
            const nivelInput = document.getElementById('nivel');
            const gradoGrupoInput = document.getElementById('grado-grupo');
            const turnoInput = document.getElementById('turno');
            const matriculaInput = document.getElementById('matricula');
            
            if (nivelInput) {
                nivelInput.value = formatearNivel(data.perfil.nivel_educativo);
            }
            
            if (gradoGrupoInput) {
                const grupo = data.perfil.grupo || '';
                gradoGrupoInput.value = `${data.perfil.grado || ''}° ${grupo}`.trim();
            }
            
            if (turnoInput) {
                turnoInput.value = formatearTurno(data.perfil.turno);
            }
            
            if (matriculaInput && data.perfil.matricula) {
                matriculaInput.value = data.perfil.matricula;
            }
            
        } else if (data.tipo_usuario === 'docente' && infoDocente) {
            infoDocente.classList.remove('hidden');
            
            // Llenar campos de docente
            const departamentoInput = document.getElementById('departamento');
            const codigoEmpleadoInput = document.getElementById('codigo-empleado');
            const asignaturasInput = document.getElementById('asignaturas');
            
            if (departamentoInput && data.perfil.departamento) {
                departamentoInput.value = formatearDepartamento(data.perfil.departamento);
            }
            
            if (codigoEmpleadoInput && data.perfil.codigo_empleado) {
                codigoEmpleadoInput.value = data.perfil.codigo_empleado;
            }
            
            if (asignaturasInput && data.perfil.asignaturas) {
                // Si asignaturas es un array, lo unimos con comas
                if (Array.isArray(data.perfil.asignaturas)) {
                    asignaturasInput.value = data.perfil.asignaturas.join(', ');
                } else {
                    asignaturasInput.value = data.perfil.asignaturas;
                }
            }
        }
    }
    
    /**
     * Actualiza las estadísticas de actividad del usuario
     * @param {Object} actividad - Datos de actividad
     */
    function actualizarEstadisticasActividad(actividad) {
        const totalPrestamos = document.getElementById('total-prestamos');
        const totalReservas = document.getElementById('total-reservas');
        const librosFavoritos = document.getElementById('libros-favoritos');
        const actividadReciente = document.getElementById('actividad-reciente');
        
        // Actualizar contadores
        if (totalPrestamos) totalPrestamos.textContent = actividad.totalPrestamos || 0;
        if (totalReservas) totalReservas.textContent = actividad.totalReservas || 0;
        if (librosFavoritos) librosFavoritos.textContent = actividad.totalFavoritos || 0;
        
        // Actualizar lista de actividad reciente
        if (actividadReciente && actividad.reciente && actividad.reciente.length > 0) {
            actividadReciente.innerHTML = '';
            
            actividad.reciente.forEach(item => {
                const elementoActividad = crearElementoActividad(item);
                actividadReciente.appendChild(elementoActividad);
            });
        } else if (actividadReciente) {
            actividadReciente.innerHTML = '<div class="activity-empty">No hay actividad reciente para mostrar.</div>';
        }
    }
    
    /**
     * Crea un elemento de actividad para la lista de actividad reciente
     * @param {Object} item - Datos de la actividad
     * @returns {HTMLElement} - Elemento DOM con la actividad formateada
     */
    function crearElementoActividad(item) {
        const div = document.createElement('div');
        div.classList.add('activity-item');
        
        // Determinar ícono según tipo de actividad
        let icono = 'info-circle';
        let colorIcono = '';
        
        switch (item.tipo) {
            case 'prestamo':
                icono = 'book';
                colorIcono = 'text-blue';
                break;
            case 'devolucion':
                icono = 'undo';
                colorIcono = 'text-green';
                break;
            case 'reserva':
                icono = 'bookmark';
                colorIcono = 'text-orange';
                break;
            case 'renovacion':
                icono = 'sync';
                colorIcono = 'text-purple';
                break;
            case 'vencimiento':
                icono = 'exclamation-circle';
                colorIcono = 'text-red';
                break;
        }
        
        // Formatear fecha
        const fecha = new Date(item.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        // Crear estructura HTML del elemento
        div.innerHTML = `
            <div class="activity-icon ${colorIcono}">
                <i class="fas fa-${icono}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${item.titulo}</div>
                <div class="activity-description">${item.descripcion}</div>
                <div class="activity-date">${fechaFormateada}</div>
            </div>
        `;
        
        return div;
    }
    
    /**
     * Maneja el envío del formulario para actualizar perfil
     * @param {Event} event - Evento de submit
     */
    async function actualizarPerfil(event) {
        event.preventDefault();
        
        // Recopilar datos del formulario
        const formData = new FormData(formPerfil);
        const perfilData = {
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido')
        };
        
        try {
            // Mostrar indicador de carga
            const submitBtn = formPerfil.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            
            // Cambiar la ruta para actualizar perfil
            const response = await fetch('/api/usuarios/mi-perfil', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(perfilData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar perfil');
            }
            
            // Actualizar información del usuario en localStorage
            const userData = JSON.parse(localStorage.getItem('user_info'));
            userData.nombre = perfilData.nombre;
            userData.apellido = perfilData.apellido;
            localStorage.setItem('user_info', JSON.stringify(userData));
            
            // Actualizar interfaz
            if (perfilNombreCompleto) {
                perfilNombreCompleto.textContent = `${perfilData.nombre} ${perfilData.apellido}`;
            }
            
            // Actualizar nombre en el menú de usuario
            const userName = document.getElementById('user-name');
            if (userName) {
                userName.textContent = `${perfilData.nombre} ${perfilData.apellido}`;
            }
            
            // Mostrar mensaje de éxito
            mostrarNotificacion('Perfil actualizado con éxito');
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message || 'Error al actualizar perfil', 'error');
        } finally {
            // Restaurar botón
            const submitBtn = formPerfil.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Cambios';
        }
    }
    
    /**
     * Maneja el envío del formulario para cambiar contraseña
     * @param {Event} event - Evento de submit
     */
    async function cambiarPassword(event) {
        event.preventDefault();
        
        // Recopilar datos del formulario
        const formData = new FormData(formPassword);
        const passwordData = {
            currentPassword: formData.get('current-password'),
            newPassword: formData.get('new-password'),
            confirmPassword: formData.get('confirm-password')
        };
        
        // Validar que las contraseñas coincidan
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            mostrarNotificacion('Las contraseñas no coinciden', 'error');
            return;
        }
        
        // Validar requisitos de contraseña
        if (passwordData.newPassword.length < 8) {
            mostrarNotificacion('La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }
        
        if (!/[A-Z]/.test(passwordData.newPassword)) {
            mostrarNotificacion('La contraseña debe contener al menos una letra mayúscula', 'error');
            return;
        }
        
        if (!/[0-9]/.test(passwordData.newPassword)) {
            mostrarNotificacion('La contraseña debe contener al menos un número', 'error');
            return;
        }
        
        try {
            // Mostrar indicador de carga
            const submitBtn = formPassword.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cambiando...';
            
            // Cambiar la ruta para actualizar contraseña
            const response = await fetch('/api/usuarios/cambiar-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(passwordData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cambiar contraseña');
            }
            
            // Limpiar formulario
            formPassword.reset();
            
            // Mostrar mensaje de éxito
            mostrarNotificacion('Contraseña cambiada con éxito');
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message || 'Error al cambiar contraseña', 'error');
        } finally {
            // Restaurar botón
            const submitBtn = formPassword.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Cambiar Contraseña';
        }
    }
    
    /**
     * Cambia la pestaña activa
     * @param {string} tabId - ID de la pestaña a activar
     */
    function cambiarTab(tabId) {
        // Activar pestaña seleccionada
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Mostrar contenido de pestaña seleccionada
        tabPanes.forEach(pane => {
            if (pane.id === tabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    }
    
    /**
     * Formatea el nivel educativo para mostrar
     * @param {string} nivel - Nivel educativo
     * @returns {string} - Nivel formateado
     */
    function formatearNivel(nivel) {
        if (!nivel) return 'No especificado';
        
        const niveles = {
            'primaria': 'Primaria',
            'secundaria_basica': 'Secundaria Básica',
            'secundaria_tecnica': 'Secundaria Técnica'
        };
        
        return niveles[nivel] || nivel;
    }
    
    /**
     * Formatea el turno para mostrar
     * @param {string} turno - Turno
     * @returns {string} - Turno formateado
     */
    function formatearTurno(turno) {
        if (!turno) return 'No especificado';
        
        const turnos = {
            'matutino': 'Matutino',
            'vespertino': 'Vespertino',
            'tiempo_completo': 'Tiempo Completo'
        };
        
        return turnos[turno] || turno;
    }
    
    /**
     * Formatea el departamento para mostrar
     * @param {string} departamento - Departamento
     * @returns {string} - Departamento formateado
     */
    function formatearDepartamento(departamento) {
        if (!departamento) return 'No especificado';
        
        const departamentos = {
            'matematicas': 'Matemáticas',
            'lengua': 'Lengua y Literatura',
            'ciencias': 'Ciencias Naturales',
            'sociales': 'Ciencias Sociales',
            'arte': 'Arte y Música',
            'educacion_fisica': 'Educación Física',
            'tecnologia': 'Tecnología',
            'idiomas': 'Idiomas Extranjeros'
        };
        
        return departamentos[departamento] || departamento;
    }
    
    /**
     * Convierte la primera letra de un texto a mayúscula
     * @param {string} texto - Texto a formatear
     * @returns {string} - Texto con primera letra en mayúscula
     */
    function primeraLetraMayuscula(texto) {
        if (!texto) return '';
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }
    
    /**
     * Muestra una notificación tipo toast
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de notificación (success, error, warning)
     */
    function mostrarNotificacion(mensaje, tipo = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
            </div>
            <div class="notification-message">${mensaje}</div>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
        
        // Auto-cerrar después de 3 segundos
        setTimeout(() => {
            cerrarNotificacion(notification);
        }, 3000);
        
        // Cerrar al hacer clic
        notification.querySelector('.notification-close').addEventListener('click', () => {
            cerrarNotificacion(notification);
        });
        
        function cerrarNotificacion(el) {
            el.classList.remove('visible');
            setTimeout(() => {
                el.remove();
            }, 300);
        }
    }
});