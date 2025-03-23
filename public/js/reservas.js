// js/reservas.js
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info') ? JSON.parse(localStorage.getItem('user_info')) : null;
    
    if (!token || !userInfo) {
        window.location.href = '/login.html';
        return;
    }
    
    // Verificar autorización (solo admin y bibliotecarios pueden acceder)
    if (userInfo.tipo_usuario !== 'administrador' && userInfo.tipo_usuario !== 'bibliotecario') {
        window.location.href = '/acceso-denegado.html';
        return;
    }
    
    // Elementos DOM
    const tabs = document.querySelectorAll('.tab');
    const reservasContainer = document.getElementById('reservas-container');
    const paginacionContainer = document.getElementById('paginacion');
    const buscarUsuario = document.getElementById('buscar-usuario');
    const estadoFiltro = document.getElementById('estado-filtro');
    const fechaDesde = document.getElementById('fecha-desde');
    const fechaHasta = document.getElementById('fecha-hasta');
    const btnFiltrar = document.getElementById('btn-filtrar');
    
    // Estado de la aplicación
    let paginaActual = 1;
    let tabActiva = 'pendientes';
    let filtros = {
        usuario: '',
        estado: '',
        fechaDesde: '',
        fechaHasta: ''
    };
    
    // Event Listeners
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            cambiarTab(this.getAttribute('data-tab'));
        });
    });
    
    btnFiltrar.addEventListener('click', aplicarFiltros);
    
    // Cargar datos iniciales
    cargarReservas();
    
    /**
     * Cambia la pestaña activa y carga las reservas correspondientes
     * @param {string} tabId - ID de la pestaña a activar
     */
    function cambiarTab(tabId) {
        tabActiva = tabId;
        
        // Actualizar UI de tabs
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Reiniciar paginación
        paginaActual = 1;
        
        // Actualizar filtros según la tab
        if (estadoFiltro) {
            if (tabId === 'pendientes') {
                estadoFiltro.value = 'pendiente';
            } else if (tabId === 'listas') {
                estadoFiltro.value = 'lista';
            } else {
                estadoFiltro.value = '';
            }
        }
        
        // Cargar reservas según la tab seleccionada
        cargarReservas();
    }
    
    /**
     * Carga las reservas según la pestaña activa y los filtros
     */
    async function cargarReservas() {
        try {
            // Mostrar loader
            reservasContainer.innerHTML = '<div class="loader">Cargando reservas...</div>';
            
            // Construir URL con parámetros
            let url = `/api/reservas?tab=${tabActiva}&pagina=${paginaActual}`;
            
            // Añadir filtros si existen
            if (filtros.usuario) url += `&usuario=${encodeURIComponent(filtros.usuario)}`;
            if (filtros.estado) url += `&estado=${encodeURIComponent(filtros.estado)}`;
            if (filtros.fechaDesde) url += `&fechaDesde=${encodeURIComponent(filtros.fechaDesde)}`;
            if (filtros.fechaHasta) url += `&fechaHasta=${encodeURIComponent(filtros.fechaHasta)}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar reservas');
            }
            
            const data = await response.json();
            
            // Vaciar contenedor
            reservasContainer.innerHTML = '';
            
            // Si no hay reservas, mostrar mensaje
            if (!data.reservas || data.reservas.length === 0) {
                reservasContainer.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-info-circle"></i>
                        <p>No se encontraron reservas con los criterios seleccionados.</p>
                    </div>
                `;
                paginacionContainer.innerHTML = '';
                return;
            }
            
            // Renderizar reservas
            data.reservas.forEach(reserva => {
                // Adaptación: Asegurarse de que las propiedades existan, independientemente de la nomenclatura
                // Comprobar si la API usa camelCase o PascalCase para las propiedades
                const reservaId = reserva.id || reserva.Id || reserva.ReservaID || reserva.reservaID;
                const fechaReserva = new Date(reserva.fechaReserva || reserva.FechaReserva).toLocaleDateString();
                const fechaExpiracion = new Date(reserva.fechaExpiracion || reserva.FechaExpiracion).toLocaleDateString();
                const estado = reserva.estado || reserva.Estado;
                
                // Obtener datos del libro y usuario, manejando diferentes estructuras posibles
                const libro = reserva.libro || reserva.Libro || {};
                const usuario = reserva.usuario || reserva.Usuario || {};
                
                const libroTitulo = libro.titulo || libro.Titulo || 'Sin título';
                const usuarioNombre = usuario.nombre || usuario.Nombre || 'Usuario';
                const usuarioApellido = usuario.apellido || usuario.Apellido || '';
                
                const reservaElement = document.createElement('div');
                reservaElement.classList.add('reserva-card');
                
                // Determinar clase de estado
                let estadoClass = '';
                switch (estado && estado.toLowerCase()) {
                    case 'pendiente':
                        estadoClass = 'status-pending';
                        break;
                    case 'lista':
                        estadoClass = 'status-ready';
                        break;
                    case 'completada':
                        estadoClass = 'status-completed';
                        break;
                    case 'cancelada':
                        estadoClass = 'status-cancelled';
                        break;
                    case 'vencida':
                        estadoClass = 'status-expired';
                        break;
                    default:
                        estadoClass = '';
                }
                
                reservaElement.innerHTML = `
                    <div class="reserva-info">
                        <h3 class="reserva-titulo">${libroTitulo}</h3>
                        <p class="reserva-usuario">Usuario: ${usuarioNombre} ${usuarioApellido}</p>
                        <p class="reserva-fechas">
                            <span>Reserva: ${fechaReserva}</span>
                            <span>Vence: ${fechaExpiracion}</span>
                        </p>
                        <div class="reserva-estado">
                            <span class="status-badge ${estadoClass}">${estado || 'Desconocido'}</span>
                        </div>
                    </div>
                    <div class="reserva-acciones">
                        <button class="btn btn-sm btn-secondary btn-detalles" data-id="${reservaId}">
                            <i class="fas fa-info-circle"></i> Detalles
                        </button>
                        ${estado && estado.toLowerCase() === 'pendiente' ? 
                            `<button class="btn btn-sm btn-success btn-lista" data-id="${reservaId}">
                                <i class="fas fa-check"></i> Marcar Lista
                            </button>` : ''
                        }
                        ${estado && estado.toLowerCase() === 'lista' ? 
                            `<button class="btn btn-sm btn-primary btn-completar" data-id="${reservaId}">
                                <i class="fas fa-check-circle"></i> Completar
                            </button>` : ''
                        }
                        ${(estado && (estado.toLowerCase() === 'pendiente' || estado.toLowerCase() === 'lista')) ? 
                            `<button class="btn btn-sm btn-danger btn-cancelar" data-id="${reservaId}">
                                <i class="fas fa-times"></i> Cancelar
                            </button>` : ''
                        }
                    </div>
                `;
                
                reservasContainer.appendChild(reservaElement);
            });
            
            // Configurar paginación
            configurarPaginacion(data.totalPaginas || 1, data.paginaActual || paginaActual);
            
            // Agregar event listeners a los botones
            document.querySelectorAll('.btn-detalles').forEach(btn => {
                btn.addEventListener('click', function() {
                    const reservaId = this.getAttribute('data-id');
                    if (reservaId && reservaId !== 'undefined' && reservaId !== 'null') {
                        verDetallesReserva(reservaId);
                    } else {
                        mostrarNotificacion('ID de reserva no válido', 'error');
                    }
                });
            });
            
            document.querySelectorAll('.btn-lista').forEach(btn => {
                btn.addEventListener('click', function() {
                    const reservaId = this.getAttribute('data-id');
                    if (reservaId && reservaId !== 'undefined' && reservaId !== 'null') {
                        cambiarEstadoReserva(reservaId, 'lista');
                    } else {
                        mostrarNotificacion('ID de reserva no válido', 'error');
                    }
                });
            });
            
            document.querySelectorAll('.btn-completar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const reservaId = this.getAttribute('data-id');
                    if (reservaId && reservaId !== 'undefined' && reservaId !== 'null') {
                        cambiarEstadoReserva(reservaId, 'completada');
                    } else {
                        mostrarNotificacion('ID de reserva no válido', 'error');
                    }
                });
            });
            
            document.querySelectorAll('.btn-cancelar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const reservaId = this.getAttribute('data-id');
                    if (reservaId && reservaId !== 'undefined' && reservaId !== 'null') {
                        cambiarEstadoReserva(reservaId, 'cancelada');
                    } else {
                        mostrarNotificacion('ID de reserva no válido', 'error');
                    }
                });
            });
            
        } catch (error) {
            console.error('Error:', error);
            reservasContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error al cargar las reservas. Por favor, intenta nuevamente.</p>
                </div>
            `;
        }
    }
    
    /**
     * Aplica los filtros ingresados por el usuario
     */
    function aplicarFiltros() {
        filtros.usuario = buscarUsuario.value.trim();
        filtros.estado = estadoFiltro.value;
        filtros.fechaDesde = fechaDesde.value;
        filtros.fechaHasta = fechaHasta.value;
        
        // Reiniciar paginación
        paginaActual = 1;
        
        // Cargar reservas con los nuevos filtros
        cargarReservas();
    }
    
    /**
     * Configura la paginación según el total de páginas
     * @param {number} totalPaginas - Total de páginas
     * @param {number} paginaActual - Página actual
     */
    function configurarPaginacion(totalPaginas, paginaActual) {
        paginacionContainer.innerHTML = '';
        
        if (totalPaginas <= 1) {
            return;
        }
        
        const paginacion = document.createElement('div');
        paginacion.classList.add('pagination');
        
        // Botón "Anterior"
        const btnAnterior = document.createElement('div');
        btnAnterior.classList.add('page-item');
        if (paginaActual === 1) btnAnterior.classList.add('disabled');
        btnAnterior.textContent = '«';
        btnAnterior.addEventListener('click', () => {
            if (paginaActual > 1) {
                cambiarPagina(paginaActual - 1);
            }
        });
        paginacion.appendChild(btnAnterior);
        
        // Botones de número de página
        for (let i = 1; i <= totalPaginas; i++) {
            // Mostrar primera, última, y páginas alrededor de la actual
            if (i === 1 || i === totalPaginas || (i >= paginaActual - 2 && i <= paginaActual + 2)) {
                const btn = document.createElement('div');
                btn.classList.add('page-item');
                if (i === paginaActual) btn.classList.add('active');
                btn.textContent = i;
                btn.addEventListener('click', () => cambiarPagina(i));
                paginacion.appendChild(btn);
            } else if (i === paginaActual - 3 || i === paginaActual + 3) {
                // Añadir puntos suspensivos
                const ellipsis = document.createElement('div');
                ellipsis.classList.add('page-item', 'disabled');
                ellipsis.textContent = '...';
                paginacion.appendChild(ellipsis);
            }
        }
        
        // Botón "Siguiente"
        const btnSiguiente = document.createElement('div');
        btnSiguiente.classList.add('page-item');
        if (paginaActual === totalPaginas) btnSiguiente.classList.add('disabled');
        btnSiguiente.textContent = '»';
        btnSiguiente.addEventListener('click', () => {
            if (paginaActual < totalPaginas) {
                cambiarPagina(paginaActual + 1);
            }
        });
        paginacion.appendChild(btnSiguiente);
        
        paginacionContainer.appendChild(paginacion);
    }
    
    /**
     * Cambia a la página especificada y actualiza las reservas
     * @param {number} pagina - Número de página
     */
    function cambiarPagina(pagina) {
        paginaActual = pagina;
        cargarReservas();
        // Hacer scroll al inicio del contenedor
        reservasContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Cambia el estado de una reserva
     * @param {string} reservaId - ID de la reserva
     * @param {string} nuevoEstado - Nuevo estado para la reserva
     */
    async function cambiarEstadoReserva(reservaId, nuevoEstado) {
        try {
            if (!reservaId || reservaId === 'undefined' || reservaId === 'null') {
                throw new Error('ID de reserva no válido');
            }
            
            // Mostrar mensaje de confirmación
            if (!confirm(`¿Estás seguro de que deseas cambiar el estado de la reserva a "${nuevoEstado}"?`)) {
                return;
            }
            
            // Enviar solicitud al servidor
            const response = await fetch(`/api/reservas/${reservaId}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cambiar el estado de la reserva');
            }
            
            // Recargar reservas
            cargarReservas();
            
            // Mostrar mensaje de éxito
            mostrarNotificacion(`Estado de reserva cambiado a "${nuevoEstado}" exitosamente`);
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message || 'Error al cambiar el estado de la reserva', 'error');
        }
    }
    
    /**
     * Ver detalles de una reserva específica
     * @param {string} reservaId - ID de la reserva
     */
    async function verDetallesReserva(reservaId) {
        try {
            if (!reservaId || reservaId === 'undefined' || reservaId === 'null') {
                throw new Error('ID de reserva no válido');
            }
            
            const response = await fetch(`/api/reservas/${reservaId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar detalles de la reserva');
            }
            
            const data = await response.json();
            
            // Adaptación: Manejar diferentes estructuras de datos
            const reservaIdModal = data.id || data.Id || data.ReservaID || data.reservaID;
            const estadoReserva = data.estado || data.Estado;
            const fechaReserva = new Date(data.fechaReserva || data.FechaReserva).toLocaleDateString();
            const fechaExpiracion = new Date(data.fechaExpiracion || data.FechaExpiracion).toLocaleDateString();
            
            // Obtener datos del libro, usuario y ejemplar
            const libro = data.libro || data.Libro || {};
            const usuario = data.usuario || data.Usuario || {};
            const ejemplar = data.ejemplar || data.Ejemplar;
            
            const libroTitulo = libro.titulo || libro.Titulo || 'Sin título';
            const libroISBN = libro.isbn || libro.ISBN || 'No disponible';
            const usuarioNombre = usuario.nombre || usuario.Nombre || 'Usuario';
            const usuarioApellido = usuario.apellido || usuario.Apellido || '';
            const usuarioTipo = usuario.tipoUsuario || usuario.tipo_usuario || usuario.TipoUsuario || 'No especificado';
            
            // Crear y mostrar un modal con los detalles
            const modal = document.createElement('div');
            modal.id = 'modal-detalles';
            modal.classList.add('modal');
            
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalles de la Reserva</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detalles-reserva">
                            <h4>${libroTitulo}</h4>
                            <p><strong>ISBN:</strong> ${libroISBN}</p>
                            <p><strong>Usuario:</strong> ${usuarioNombre} ${usuarioApellido}</p>
                            <p><strong>Tipo de usuario:</strong> ${usuarioTipo}</p>
                            <p><strong>Fecha de reserva:</strong> ${fechaReserva}</p>
                            <p><strong>Fecha de expiración:</strong> ${fechaExpiracion}</p>
                            <p><strong>Estado:</strong> <span class="status-badge ${getEstadoClass(estadoReserva)}">${estadoReserva}</span></p>
                            ${ejemplar ? 
                              `<p><strong>Ejemplar asignado:</strong> ${ejemplar.codigoBarras || ejemplar.CodigoBarras || ejemplar.codigo || ejemplar.Codigo || 'No disponible'}</p>` : 
                              ''}
                            ${data.notas || data.Notas ? 
                              `<p><strong>Notas:</strong> ${data.notas || data.Notas}</p>` : 
                              ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-close">Cerrar</button>
                        ${estadoReserva && estadoReserva.toLowerCase() === 'pendiente' ? 
                            `<button class="btn btn-success btn-lista-modal" data-id="${reservaIdModal}">Marcar Lista</button>` : ''}
                        ${estadoReserva && estadoReserva.toLowerCase() === 'lista' ? 
                            `<button class="btn btn-primary btn-completar-modal" data-id="${reservaIdModal}">Completar</button>` : ''}
                        ${estadoReserva && (estadoReserva.toLowerCase() === 'pendiente' || estadoReserva.toLowerCase() === 'lista') ? 
                            `<button class="btn btn-danger btn-cancelar-modal" data-id="${reservaIdModal}">Cancelar</button>` : ''}
                    </div>
                </div>
            `;
            
            // Añadir el modal al DOM
            document.body.appendChild(modal);
            
            // Mostrar el modal
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            
            // Configurar event listeners para cerrar modal
            modal.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.remove();
                    }, 300);
                });
            });
            
            // Configurar event listeners para botones de acción
            const btnLista = modal.querySelector('.btn-lista-modal');
            if (btnLista) {
                btnLista.addEventListener('click', () => {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.remove();
                        if (reservaIdModal && reservaIdModal !== 'undefined' && reservaIdModal !== 'null') {
                            cambiarEstadoReserva(reservaIdModal, 'lista');
                        } else {
                            mostrarNotificacion('ID de reserva no válido', 'error');
                        }
                    }, 300);
                });
            }
            
            const btnCompletar = modal.querySelector('.btn-completar-modal');
            if (btnCompletar) {
                btnCompletar.addEventListener('click', () => {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.remove();
                        if (reservaIdModal && reservaIdModal !== 'undefined' && reservaIdModal !== 'null') {
                            cambiarEstadoReserva(reservaIdModal, 'completada');
                        } else {
                            mostrarNotificacion('ID de reserva no válido', 'error');
                        }
                    }, 300);
                });
            }
            
            const btnCancelar = modal.querySelector('.btn-cancelar-modal');
            if (btnCancelar) {
                btnCancelar.addEventListener('click', () => {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.remove();
                        if (reservaIdModal && reservaIdModal !== 'undefined' && reservaIdModal !== 'null') {
                            cambiarEstadoReserva(reservaIdModal, 'cancelada');
                        } else {
                            mostrarNotificacion('ID de reserva no válido', 'error');
                        }
                    }, 300);
                });
            }
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar detalles de la reserva: ' + error.message, 'error');
        }
    }
    
    /**
     * Obtiene la clase CSS para el estado de una reserva
     * @param {string} estado - Estado de la reserva
     * @returns {string} - Clase CSS correspondiente
     */
    function getEstadoClass(estado) {
        if (!estado) return '';
        
        switch (estado.toLowerCase()) {
            case 'pendiente':
                return 'status-pending';
            case 'lista':
                return 'status-ready';
            case 'completada':
                return 'status-completed';
            case 'cancelada':
                return 'status-cancelled';
            case 'vencida':
                return 'status-expired';
            default:
                return '';
        }
    }
    
    /**
     * Muestra una notificación en pantalla
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de notificación ('success', 'error', 'warning')
     */
    function mostrarNotificacion(mensaje, tipo = 'success') {
        // Crear contenedor de notificación si no existe
        let notificacion = document.querySelector('.notification');
        
        if (!notificacion) {
            notificacion = document.createElement('div');
            notificacion.classList.add('notification');
            document.body.appendChild(notificacion);
        }
        
        // Crear elemento de notificación
        const notificacionItem = document.createElement('div');
        notificacionItem.classList.add('notification-item', `notification-${tipo}`);
        
        // Añadir icono según tipo
        let icono = 'check-circle';
        if (tipo === 'error') icono = 'exclamation-circle';
        if (tipo === 'warning') icono = 'exclamation-triangle';
        
        notificacionItem.innerHTML = `
            <i class="fas fa-${icono}"></i>
            <span>${mensaje}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Añadir al contenedor y mostrar
        notificacion.appendChild(notificacionItem);
        
        // Configurar event listener para cerrar
        notificacionItem.querySelector('.notification-close').addEventListener('click', () => {
            notificacionItem.classList.add('notification-hide');
            setTimeout(() => {
                notificacionItem.remove();
            }, 300);
        });
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            if (notificacionItem.parentNode) {
                notificacionItem.classList.add('notification-hide');
                setTimeout(() => {
                    notificacionItem.remove();
                }, 300);
            }
        }, 5000);
    }
});