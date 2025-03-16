// js/dashboard.js - Versión mejorada
document.addEventListener('DOMContentLoaded', function() {
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
    const actividadReciente = document.getElementById('actividad-reciente');
    const graficoNiveles = document.getElementById('grafico-niveles');
    
    // Iniciar con loaders
    prestamosActivos.innerHTML = '<div class="loader-sm"></div>';
    prestamosVencidos.innerHTML = '<div class="loader-sm"></div>';
    ejemplaresDisponibles.innerHTML = '<div class="loader-sm"></div>';
    reservasPendientes.innerHTML = '<div class="loader-sm"></div>';
    actividadReciente.innerHTML = '<div class="loading-container"><div class="loader"></div><p>Cargando actividad reciente...</p></div>';
    
    // Inicializar y cargar los datos
    inicializarDashboard();
    
    /**
     * Inicializa el dashboard y carga todos los datos necesarios
     */
    async function inicializarDashboard() {
        try {
            await Promise.all([
                cargarEstadisticas(),
                cargarActividadReciente(),
                cargarGraficoNiveles()
            ]);
            
            // Mostrar notificación de éxito
            mostrarNotificacion('Dashboard cargado correctamente', 'success');
            
            // Configurar actualización periódica
            const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos
            setInterval(actualizarDatosDashboard, REFRESH_INTERVAL);
        } catch (error) {
            console.error('Error al inicializar dashboard:', error);
            mostrarNotificacion('Error al cargar el dashboard. Intenta recargar la página.', 'error');
        }
    }
    
    /**
     * Actualiza todos los datos del dashboard
     */
    async function actualizarDatosDashboard() {
        try {
            await Promise.all([
                cargarEstadisticas(false),  // false = sin animación
                cargarActividadReciente(),
            ]);
            console.log('Dashboard actualizado:', new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Error al actualizar dashboard:', error);
        }
    }
    
    /**
     * Carga las estadísticas generales del dashboard
     * @param {boolean} conAnimacion - Indica si se debe animar los contadores
     */
    async function cargarEstadisticas(conAnimacion = true) {
        try {
            // En un entorno real, se haría una petición al backend
            const endpoint = '/api/dashboard/estadisticas';
            
            // Simulación para demostración
            await simulateNetworkDelay(800);
            
            // En un entorno real, esta sería la respuesta del servidor
            const data = {
                prestamosActivos: Math.floor(Math.random() * 50) + 100,
                prestamosVencidos: Math.floor(Math.random() * 20) + 5,
                ejemplaresDisponibles: Math.floor(Math.random() * 300) + 1200,
                reservasPendientes: Math.floor(Math.random() * 15) + 20,
                tendencias: {
                    prestamosActivos: 5.2,
                    prestamosVencidos: -2.3
                }
            };
            
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
            
            tendenciaPrestamos.textContent = `${data.tendencias.prestamosActivos > 0 ? '+' : ''}${data.tendencias.prestamosActivos.toFixed(1)}% esta semana`;
            tendenciaVencidos.textContent = `${data.tendencias.prestamosVencidos > 0 ? '+' : ''}${data.tendencias.prestamosVencidos.toFixed(1)}% esta semana`;
            
            tendenciaPrestamos.className = `stat-trend ${data.tendencias.prestamosActivos > 0 ? 'positive' : 'negative'}`;
            tendenciaVencidos.className = `stat-trend ${data.tendencias.prestamosVencidos > 0 ? 'negative' : 'positive'}`;
            
            return data;
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            mostrarNotificacion('Error al cargar estadísticas', 'error');
            
            // En caso de error, mostrar mensaje en los contadores
            prestamosActivos.textContent = 'Error';
            prestamosVencidos.textContent = 'Error';
            ejemplaresDisponibles.textContent = 'Error';
            reservasPendientes.textContent = 'Error';
            
            throw error;
        }
    }
    
    /**
     * Carga la actividad reciente para mostrar en el dashboard
     */
    async function cargarActividadReciente() {
        try {
            // En un entorno real, consultaríamos un endpoint
            // const response = await fetch('/api/dashboard/actividad');
            // const data = await response.json();
            
            // Simulación para demostración
            await simulateNetworkDelay(1200);
            
            // Datos de muestra
            const data = {
                actividad: [
                    {
                        id: 1,
                        tipo: 'prestamo',
                        titulo: 'Nuevo préstamo registrado',
                        descripcion: 'Ana García (4°B) - "El principito"',
                        timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutos atrás
                    },
                    {
                        id: 2,
                        tipo: 'devolucion',
                        titulo: 'Devolución registrada',
                        descripcion: 'Carlos Rodríguez (5°A) - "Harry Potter y la piedra filosofal"',
                        timestamp: new Date(Date.now() - 45 * 60 * 1000) // 45 minutos atrás
                    },
                    {
                        id: 3,
                        tipo: 'reserva',
                        titulo: 'Reserva lista para recoger',
                        descripcion: 'Laura Martínez (3°C) - "Cien años de soledad"',
                        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
                    },
                    {
                        id: 4,
                        tipo: 'libro',
                        titulo: 'Nuevos ejemplares añadidos',
                        descripcion: '3 ejemplares de "Don Quijote de la Mancha"',
                        timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000) // 3.5 horas atrás
                    },
                    {
                        id: 5,
                        tipo: 'usuario',
                        titulo: 'Nuevo usuario registrado',
                        descripcion: 'Prof. Martín López - Departamento de Literatura',
                        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 horas atrás
                    }
                ]
            };
            
            // Vaciar el contenedor
            actividadReciente.innerHTML = '';
            
            // Si no hay actividad, mostrar mensaje
            if (!data.actividad || data.actividad.length === 0) {
                actividadReciente.innerHTML = '<li class="no-activity">No hay actividad reciente para mostrar.</li>';
                return;
            }
            
            // Llenar con los datos recibidos
            data.actividad.forEach((item, index) => {
                const li = document.createElement('li');
                li.classList.add('activity-item');
                li.setAttribute('data-type', item.tipo);
                
                // Añadir un retraso progresivo para animación de entrada
                li.style.animationDelay = `${index * 0.1}s`;
                
                // Formatear timestamp de forma relativa (hace X minutos/horas)
                const tiempoRelativo = formatearTiempoRelativo(item.timestamp);
                
                li.innerHTML = `
                    <div class="activity-icon"><i class="fas ${getActivityIcon(item.tipo)}"></i></div>
                    <div class="activity-content">
                        <div class="activity-title">${item.titulo}</div>
                        <div class="activity-details">${item.descripcion}</div>
                        <div class="activity-time">${tiempoRelativo}</div>
                    </div>
                `;
                
                actividadReciente.appendChild(li);
            });
            
            return data;
        } catch (error) {
            console.error('Error al cargar actividad reciente:', error);
            actividadReciente.innerHTML = '<li class="error-message">Error al cargar actividad reciente.</li>';
            throw error;
        }
    }
    
    /**
     * Carga y renderiza el gráfico de distribución por nivel
     */
    async function cargarGraficoNiveles() {
        try {
            // En un entorno real, consultaríamos un endpoint
            // const response = await fetch('/api/dashboard/distribucion-niveles');
            // const data = await response.json();
            
            // Simulación para demostración
            await simulateNetworkDelay(1500);
            
            // Datos de muestra
            const data = {
                primaria: 45,
                secundariaBasica: 35,
                secundariaTecnica: 20
            };
            
            // Activar las barras del gráfico con su anchura correcta
            const barras = graficoNiveles.querySelectorAll('.chart-bar');
            
            // Actualizar anchuras y valores
            setTimeout(() => {
                barras[0].style.width = `${data.primaria}%`;
                barras[0].querySelector('.chart-value').textContent = `${data.primaria}%`;
                
                setTimeout(() => {
                    barras[1].style.width = `${data.secundariaBasica}%`;
                    barras[1].querySelector('.chart-value').textContent = `${data.secundariaBasica}%`;
                    
                    setTimeout(() => {
                        barras[2].style.width = `${data.secundariaTecnica}%`;
                        barras[2].querySelector('.chart-value').textContent = `${data.secundariaTecnica}%`;
                    }, 200);
                }, 200);
            }, 200);
            
            return data;
        } catch (error) {
            console.error('Error al cargar el gráfico:', error);
            graficoNiveles.innerHTML = '<div class="error-message">Error al cargar el gráfico.</div>';
            throw error;
        }
    }
    
    /**
     * Obtiene el icono correspondiente según el tipo de actividad
     * @param {string} tipo - Tipo de actividad
     * @returns {string} - Clase CSS del icono
     */
    function getActivityIcon(tipo) {
        switch (tipo) {
            case 'prestamo':
                return 'fa-book';
            case 'devolucion':
                return 'fa-undo';
            case 'reserva':
                return 'fa-bookmark';
            case 'usuario':
                return 'fa-user';
            case 'libro':
                return 'fa-book-open';
            default:
                return 'fa-info-circle';
        }
    }
    
    /**
     * Formatea una fecha como tiempo relativo (ej: "hace 5 minutos")
     * @param {Date|string} fecha - Fecha a formatear
     * @returns {string} - Texto formateado
     */
    function formatearTiempoRelativo(fecha) {
        const ahora = new Date();
        const tiempo = new Date(fecha);
        const diferencia = Math.floor((ahora - tiempo) / 1000); // en segundos
        
        if (diferencia < 60) {
            return 'hace menos de un minuto';
        } else if (diferencia < 3600) {
            const minutos = Math.floor(diferencia / 60);
            return `hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
        } else if (diferencia < 86400) {
            const horas = Math.floor(diferencia / 3600);
            return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
        } else {
            const dias = Math.floor(diferencia / 86400);
            return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
        }
    }
    
    /**
     * Anima un contador desde 0 hasta un valor final
     * @param {HTMLElement} elemento - Elemento DOM que muestra el contador
     * @param {number} valorFinal - Valor final del contador
     * @param {number} duracion - Duración de la animación en ms (por defecto 1000ms)
     */
    function animateCounter(elemento, valorFinal, duracion = 1000) {
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
     * Simula un retraso de red para pruebas
     * @param {number} ms - Milisegundos de retraso
     * @returns {Promise} - Promesa que se resuelve después del tiempo indicado
     */
    function simulateNetworkDelay(ms = 1000) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Muestra una notificación en la interfaz
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de notificación: 'error', 'success', 'warning', 'info'
     * @param {number} duracion - Duración en ms (por defecto 5000ms)
     */
    function mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
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
        
        document.body.appendChild(notificacion);
        
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
                document.body.removeChild(notificacion);
            }
        }, 300);
    }
    
    // Añadir evento de clic para las tarjetas de acción
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Añadir efecto de pulsación
            this.classList.add('pulse');
            setTimeout(() => {
                this.classList.remove('pulse');
            }, 300);
        });
    });
    
    // Exportar funciones útiles al scope global para debugging
    window.dashboardUtils = {
        actualizarDatosDashboard,
        mostrarNotificacion,
        cargarEstadisticas,
        cargarActividadReciente,
        cargarGraficoNiveles
    };
});