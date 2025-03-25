// dashboard.js - Implementación sin simulaciones
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales para datos de la aplicación
    let datosEstadisticas = {};
    
    // Verificar autenticación
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info') ? JSON.parse(localStorage.getItem('user_info')) : null;
    
    if (!token || !userInfo) {
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }
    
    // Verificar autorización (solo admin y bibliotecarios pueden acceder)
    if (userInfo.tipo_usuario !== 'administrador' && userInfo.tipo_usuario !== 'bibliotecario') {
        window.location.href = '/acceso-denegado.html';
        return;
    }
    
    // Elementos DOM
    const prestamosActivos = document.getElementById('prestamos-activos');
    const prestamosVencidos = document.getElementById('prestamos-vencidos');
    const ejemplaresDisponibles = document.getElementById('ejemplares-disponibles');
    const reservasPendientes = document.getElementById('reservas-pendientes');
    
    // Iniciar con loaders
    prestamosActivos.innerHTML = '<div class="loader-sm"></div>';
    prestamosVencidos.innerHTML = '<div class="loader-sm"></div>';
    ejemplaresDisponibles.innerHTML = '<div class="loader-sm"></div>';
    reservasPendientes.innerHTML = '<div class="loader-sm"></div>';
    
    // Configurar eventos para botones de acción
    configurarBotonesAccion();
    
    // Inicializar y cargar los datos
    inicializarDashboard();
    
    /**
     * Inicializa el dashboard y carga todos los datos necesarios
     */
    async function inicializarDashboard() {
        try {
            // Cargar datos del backend
            await cargarEstadisticas();
            
            // Mostrar notificación de éxito
            mostrarNotificacion('Dashboard cargado correctamente', 'success');
            
            // Configurar actualización periódica (cada 5 minutos)
            const REFRESH_INTERVAL = 5 * 60 * 1000;
            setInterval(actualizarDatosDashboard, REFRESH_INTERVAL);
        } catch (error) {
            console.error('Error al inicializar dashboard:', error);
            mostrarNotificacion('Error al cargar datos. Contacta al administrador.', 'error');
        }
    }
    
    /**
     * Configura los botones de acción del dashboard
     */
    function configurarBotonesAccion() {
        // Obtener todas las tarjetas de acción
        const actionCards = document.querySelectorAll('.action-card');
        
        // Para cada tarjeta, añadir evento de clic
        actionCards.forEach(card => {
            card.addEventListener('click', function(e) {
                // Si el enlace tiene su propio href, dejarlo funcionar normalmente
                if (this.getAttribute('href') !== '#' && this.getAttribute('href')) {
                    // Añadir efecto de pulsación
                    this.classList.add('pulse');
                    setTimeout(() => {
                        this.classList.remove('pulse');
                    }, 300);
                    return;
                }
                
                // Prevenir navegación por defecto para enlaces "#"
                e.preventDefault();
                
                // Obtener el texto del título para determinar la acción
                const actionTitle = this.querySelector('.action-title').textContent.trim();
                
                // Ejecutar la acción correspondiente
                switch (actionTitle) {
                    case 'Gestionar Préstamos':
                        window.location.href = '/prestamos.html';
                        break;
                    case 'Gestionar Reservas':
                        window.location.href = '/reservas.html';
                        break;
                    case 'Generar Reportes':
                        window.location.href = '/reportes.html';
                        break;
                    case 'Gestionar Perfiles':
                        window.location.href = '/perfiles.html';
                        break;
                    case 'Inventario':
                        window.location.href = '/inventario.html';
                        break;
                    default:
                        mostrarNotificacion('Funcionalidad en desarrollo', 'info');
                        break;
                }
                
                // Añadir efecto de pulsación
                this.classList.add('pulse');
                setTimeout(() => {
                    this.classList.remove('pulse');
                }, 300);
            });
        });
    }
    
    /**
     * Actualiza todos los datos del dashboard
     */
    async function actualizarDatosDashboard() {
        try {
            await cargarEstadisticas(false);  // false = sin animación
            console.log('Dashboard actualizado:', new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Error al actualizar dashboard:', error);
        }
    }
    
    /**
     * Carga las estadísticas generales del dashboard desde el backend
     * @param {boolean} conAnimacion - Indica si se debe animar los contadores
     */
    async function cargarEstadisticas(conAnimacion = true) {
        try {
            // Realizar petición al backend
            const response = await fetch('/api/dashboard/estadisticas', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            
            // Obtener datos de la respuesta
            const data = await response.json();
            console.log('Datos cargados:', data);
            
            // Guardar datos para uso posterior
            datosEstadisticas = data;
            
            // Actualizar los contadores con o sin animación
            if (conAnimacion) {
                animateCounter(prestamosActivos, data.prestamosActivos);
                animateCounter(prestamosVencidos, data.prestamosVencidos);
                animateCounter(ejemplaresDisponibles, data.ejemplaresDisponibles);
                animateCounter(reservasPendientes, data.reservasPendientes);
            } else {
                prestamosActivos.textContent = data.prestamosActivos;
                prestamosVencidos.textContent = data.prestamosVencidos;
                ejemplaresDisponibles.textContent = data.ejemplaresDisponibles;
                reservasPendientes.textContent = data.reservasPendientes;
            }
            
            // Actualizar tendencias
            const tendenciaPrestamos = document.querySelector('.stat-card:nth-child(1) .stat-trend');
            const tendenciaVencidos = document.querySelector('.stat-card:nth-child(2) .stat-trend');
            
            if (tendenciaPrestamos && tendenciaVencidos) {
                tendenciaPrestamos.textContent = `${data.tendencias.prestamosActivos > 0 ? '+' : ''}${data.tendencias.prestamosActivos.toFixed(1)}% esta semana`;
                tendenciaVencidos.textContent = `${data.tendencias.prestamosVencidos > 0 ? '+' : ''}${data.tendencias.prestamosVencidos.toFixed(1)}% esta semana`;
                
                tendenciaPrestamos.className = `stat-trend ${data.tendencias.prestamosActivos > 0 ? 'positive' : 'negative'}`;
                tendenciaVencidos.className = `stat-trend ${data.tendencias.prestamosVencidos > 0 ? 'negative' : 'positive'}`;
            }
            
            return data;
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            mostrarNotificacion('Error al cargar estadísticas: ' + error.message, 'error');
            
            // En caso de error, mostrar mensaje en los contadores
            prestamosActivos.textContent = 'Error';
            prestamosVencidos.textContent = 'Error';
            ejemplaresDisponibles.textContent = 'Error';
            reservasPendientes.textContent = 'Error';
            
            throw error;
        }
    }
    
    /**
     * Anima un contador desde 0 hasta un valor final
     * @param {HTMLElement} elemento - Elemento DOM que muestra el contador
     * @param {number} valorFinal - Valor final del contador
     * @param {number} duracion - Duración de la animación en ms (por defecto 1000ms)
     */
    function animateCounter(elemento, valorFinal, duracion = 1000) {
        if (!elemento) return;
        
        // Valor actual (0 si es la primera carga, o el valor que ya tenía)
        const valorActual = parseInt(elemento.textContent) || 0;
        
        // Calcular el incremento por cada paso
        const incremento = (valorFinal - valorActual) / (duracion / 16);
        let valor = valorActual;
        
        // Si no hay cambio, no hacer nada
        if (valorActual === valorFinal) return;
        
        // Función de animación
        function animate() {
            valor += incremento;
            
            // Si ya llegamos o pasamos el valor final, mostrar el valor final exacto
            if ((incremento >= 0 && valor >= valorFinal) || (incremento < 0 && valor <= valorFinal)) {
                elemento.textContent = valorFinal;
                return;
            }
            
            // Actualizar el elemento con el valor redondeado actual
            elemento.textContent = Math.round(valor);
            
            // Continuar la animación
            requestAnimationFrame(animate);
        }
        
        // Iniciar animación
        animate();
    }
    
    /**
     * Muestra una notificación en la interfaz
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de notificación: 'error', 'success', 'warning', 'info'
     * @param {number} duracion - Duración en ms (por defecto 5000ms)
     */
    function mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
        // Buscar si ya existe un contenedor de notificaciones
        let notificacionesContainer = document.querySelector('.notificaciones-container');
        
        // Si no existe, crearlo
        if (!notificacionesContainer) {
            notificacionesContainer = document.createElement('div');
            notificacionesContainer.className = 'notificaciones-container';
            document.body.appendChild(notificacionesContainer);
        }
        
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        
        // Icono según tipo
        let icono = 'fa-info-circle';
        if (tipo === 'error') icono = 'fa-exclamation-circle';
        if (tipo === 'success') icono = 'fa-check-circle';
        if (tipo === 'warning') icono = 'fa-exclamation-triangle';
        
        notificacion.innerHTML = `
            <div class="notificacion-contenido">
                <i class="fas ${icono}"></i>
                <span>${mensaje}</span>
            </div>
            <button class="notificacion-cerrar">&times;</button>
        `;
        
        notificacionesContainer.appendChild(notificacion);
        
        // Mostrar con animación
        setTimeout(() => {
            notificacion.classList.add('visible');
        }, 10);
        
        // Configurar botón para cerrar
        const btnCerrar = notificacion.querySelector('.notificacion-cerrar');
        btnCerrar.addEventListener('click', () => {
            cerrarNotificacion(notificacion);
        });
        
        // Auto cerrar después del tiempo especificado
        if (duracion > 0) {
            setTimeout(() => {
                cerrarNotificacion(notificacion);
            }, duracion);
        }
        
        return notificacion;
    }
    
    /**
     * Cierra una notificación con animación
     * @param {HTMLElement} notificacion - Elemento de notificación a cerrar
     */
    function cerrarNotificacion(notificacion) {
        if (!notificacion || !document.body.contains(notificacion)) return;
        
        notificacion.classList.remove('visible');
        setTimeout(() => {
            if (document.body.contains(notificacion)) {
                notificacion.parentNode.removeChild(notificacion);
                
                // Si no quedan notificaciones, eliminar el contenedor
                const container = document.querySelector('.notificaciones-container');
                if (container && container.children.length === 0) {
                    container.parentNode.removeChild(container);
                }
            }
        }, 300);
    }
    
    // Exportar funciones útiles al scope global para debugging y reutilización
    window.dashboardUtils = {
        actualizarDatosDashboard,
        mostrarNotificacion,
        cargarEstadisticas,
        getDatosEstadisticas: () => datosEstadisticas
    };
});