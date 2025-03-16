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
            const response = await fetch('/api/perfil', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar datos del perfil');
            }
            
            const data = await response.json();
            
            // Actualizar información básica en la UI
            perfilNombreCompleto.textContent = `${data.nombre} ${data.apellido}`;
            perfilTipoUsuario.textContent = primeraLetraMayuscula(data.tipo_usuario);
            perfilEmail.textContent = data.email;
            
            // Llenar formulario de información personal
            nombreInput.value = data.nombre;
            apellidoInput.value = data.apellido;
            emailInput.value = data.email;
            
            // Mostrar información específica según tipo de usuario
            mostrarInfoEspecifica(data);
            
            // Cargar datos de actividad si están disponibles
            if (data.actividad) {
                actualizarEstadisticasActividad(data.actividad);
            }
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar datos del perfil', 'error');
        }
    }
    
    /**
     * Muestra información específica según el tipo de usuario
     * @param {Object} data - Datos del perfil
     */
    function mostrarInfoEspecifica(data) {
        // Ocultar todos los contenedores
        if (infoAlumno) infoAlumno.classList.add('hidden');
        if (infoDocente) infoDocente.classList.add('hidden');
        
        // Mostrar contenedor según tipo de usuario
        if (data.tipo_usuario === 'alumno' && infoAlumno) {
            infoAlumno.classList.remove('hidden');
            
            // Llenar campos de alumno
            if (data.perfil) {
                const nivelInput = document.getElementById('nivel');
                const gradoGrupoInput = document.getElementById('grado-grupo');
                const turnoInput = document.getElementById('turno');
                
                if (nivelInput) {
                    nivelInput.value = formatearNivel(data.perfil.nivel_educativo);
                }
                
                if (gradoGrupoInput) {
                    gradoGrupoInput.value = `${data.perfil.grado}° ${data.perfil.grupo || ''}`.trim();
                }
                
                if (turnoInput) {
                    turnoInput.value = formatearTurno(data.perfil.turno);
                }
            }
        } else if (data.tipo_usuario === 'docente' && infoDocente) {
            infoDocente.classList.remove('hidden');
            
            // Llenar campos de docente
            if (data.perfil) {
                const departamentoInput = document.getElementById('departamento');
                const codigoEmpleadoInput = document.getElementById('codigo-empleado');
                
                if (departamentoInput) {
                    departamentoInput.value = data.perfil.departamento || '';
                }
                
                if (codigoEmpleadoInput) {
                    codigoEmpleadoInput.value = data.perfil.codigo_empleado || '';
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
                const div = document.createElement('div');
                div.classList.add('activity-item');
                
                let icono = 'info-circle';
                switch (item.tipo) {
                    case 'prestamo':
                        icono = 'book';
                        break;
                    case 'devolucion':
                        icono = 'undo';
                        break;
                    case 'reserva':
                        icono = 'bookmark';
                        break;
                }
                
                const fecha = new Date(item.fecha).toLocaleDateString();
                
                div.innerHTML = `
                    <div class="activity-icon">
                        <i class="fas fa-${icono}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${item.titulo}</div>
                        <div class="activity-description">${item.descripcion}</div>
                        <div class="activity-date">${fecha}</div>
                    </div>
                `;
                
                actividadReciente.appendChild(div);
            });
        } else if (actividadReciente) {
            actividadReciente.innerHTML = '<div class="activity-empty">No hay actividad reciente para mostrar.</div>';
        }
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
            
            // Enviar datos al servidor
            const response = await fetch('/api/perfil', {
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
            perfilNombreCompleto.textContent = `${perfilData.nombre} ${perfilData.apellido}`;
            
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
            
            // Enviar datos al servidor
            const response = await fetch('/api/perfil/password', {
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
        if (!nivel) return '';
        
        switch (nivel) {
            case 'primaria':
                return 'Primaria';
            case 'secundaria_basica':
                return 'Secundaria Básica';
            case 'secundaria_tecnica':
                return 'Secundaria Técnica';
            default:
                return nivel;
        }
    }
    
    /**
     * Formatea el turno para mostrar
     * @param {string} turno - Turno
     * @returns {string} - Turno formateado
     */
    function formatearTurno(turno) {
        if (!turno) return '';
        
        switch (turno) {
            case 'matutino':
                return 'Matutino';
            case 'vespertino':
                return 'Vespertino';
            case 'tiempo_completo':
                return 'Tiempo Completo';
            default:
                return turno;
        }
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
        const toast = document.getElementById('toast-notification');
        const toastMessage = document.getElementById('toast-message');
        const toastIcon = document.querySelector('.toast-icon');
        
        // Establecer mensaje
        toastMessage.textContent = mensaje;
        
        // Configurar icono según tipo
        if (toastIcon) {
            toastIcon.className = 'toast-icon fas';
            
            switch (tipo) {
                case 'success':
                    toastIcon.classList.add('fa-check-circle');
                    break;
                case 'error':
                    toastIcon.classList.add('fa-exclamation-circle');
                    break;
                case 'warning':
                    toastIcon.classList.add('fa-exclamation-triangle');
                    break;
                default:
                    toastIcon.classList.add('fa-info-circle');
            }
        }
        
        // Mostrar toast
        toast.classList.remove('hidden');
        toast.classList.add('toast-' + tipo);
        
        // Ocultar automáticamente después de 3 segundos
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('toast-' + tipo);
        }, 3000);
        
        // Configurar evento para cerrar manualmente
        const toastClose = document.getElementById('toast-close');
        if (toastClose) {
            toastClose.addEventListener('click', () => {
                toast.classList.add('hidden');
                toast.classList.remove('toast-' + tipo);
            });
        }
    }
});