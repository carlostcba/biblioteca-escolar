// js/prestamos.js
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
    const prestamosContainer = document.getElementById('prestamos-container');
    const paginacion = document.getElementById('paginacion');
    const btnNuevoPrestamo = document.getElementById('btn-nuevo-prestamo');
    const btnRegistrarDevolucion = document.getElementById('btn-registrar-devolucion');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const buscarUsuario = document.getElementById('buscar-usuario');
    const buscarLibro = document.getElementById('buscar-libro');
    const estadoFiltro = document.getElementById('estado-filtro');
    
    // Estado de la aplicación
    let paginaActual = 1;
    let tabActiva = 'activos';
    let filtros = {
        usuario: '',
        libro: '',
        estado: ''
    };
    
    // Event Listeners
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            cambiarTab(this.getAttribute('data-tab'));
        });
    });
    
    btnNuevoPrestamo.addEventListener('click', abrirModalNuevoPrestamo);
    btnRegistrarDevolucion.addEventListener('click', abrirModalDevolucion);
    btnFiltrar.addEventListener('click', aplicarFiltros);
    
    // Cargar datos iniciales
    cargarPrestamos();
    
    /**
     * Cambia la pestaña activa y carga los préstamos correspondientes
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
        
        // Cargar préstamos según la tab seleccionada
        cargarPrestamos();
    }
    
    /**
     * Carga los préstamos según la pestaña activa y los filtros
     */
    async function cargarPrestamos() {
        try {
            // Mostrar loader
            prestamosContainer.innerHTML = '<div class="loader">Cargando préstamos...</div>';
            
            // Construir URL con parámetros
            let url = `/api/prestamos?tipo=${tabActiva}&pagina=${paginaActual}`;
            
            // Añadir filtros si existen
            if (filtros.usuario) url += `&usuario=${encodeURIComponent(filtros.usuario)}`;
            if (filtros.libro) url += `&libro=${encodeURIComponent(filtros.libro)}`;
            if (filtros.estado) url += `&estado=${encodeURIComponent(filtros.estado)}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar préstamos');
            }
            
            const data = await response.json();
            
            // Vaciar contenedor
            prestamosContainer.innerHTML = '';
            
            // Si no hay préstamos, mostrar mensaje
            if (!data.prestamos || data.prestamos.length === 0) {
                prestamosContainer.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-info-circle"></i>
                        <p>No se encontraron préstamos con los criterios seleccionados.</p>
                    </div>
                `;
                paginacion.innerHTML = '';
                return;
            }
            
            // Renderizar préstamos
            data.prestamos.forEach(prestamo => {
                const fechaPrestamo = new Date(prestamo.fechaPrestamo).toLocaleDateString();
                const fechaDevolucion = new Date(prestamo.fechaDevolucion).toLocaleDateString();
                
                const prestamoElement = document.createElement('div');
                prestamoElement.classList.add('prestamo-card');
                
                // Determinar clase de estado
                let estadoClass = '';
                switch (prestamo.estado) {
                    case 'activo':
                        estadoClass = 'status-active';
                        break;
                    case 'vencido':
                        estadoClass = 'status-overdue';
                        break;
                    case 'devuelto':
                        estadoClass = 'status-returned';
                        break;
                    default:
                        estadoClass = '';
                }
                
                prestamoElement.innerHTML = `
                    <div class="prestamo-info">
                        <h3 class="prestamo-titulo">${prestamo.libro.titulo}</h3>
                        <p class="prestamo-usuario">Usuario: ${prestamo.usuario.nombre} ${prestamo.usuario.apellido}</p>
                        <p class="prestamo-fechas">
                            <span>Préstamo: ${fechaPrestamo}</span>
                            <span>Devolución: ${fechaDevolucion}</span>
                        </p>
                        <div class="prestamo-estado">
                            <span class="status-badge ${estadoClass}">${prestamo.estado}</span>
                        </div>
                    </div>
                    <div class="prestamo-acciones">
                        <button class="btn btn-sm btn-secondary btn-detalles" data-id="${prestamo.id}">
                            <i class="fas fa-info-circle"></i> Detalles
                        </button>
                        ${prestamo.estado === 'activo' || prestamo.estado === 'vencido' ? 
                            `<button class="btn btn-sm btn-primary btn-devolver" data-id="${prestamo.id}">
                                <i class="fas fa-undo"></i> Devolver
                            </button>` : ''
                        }
                    </div>
                `;
                
                prestamosContainer.appendChild(prestamoElement);
            });
            
            // Configurar paginación
            configurarPaginacion(data.totalPaginas, data.paginaActual);
            
            // Agregar event listeners a los botones
            document.querySelectorAll('.btn-detalles').forEach(btn => {
                btn.addEventListener('click', function() {
                    const prestamoId = this.getAttribute('data-id');
                    verDetallesPrestamo(prestamoId);
                });
            });
            
            document.querySelectorAll('.btn-devolver').forEach(btn => {
                btn.addEventListener('click', function() {
                    const prestamoId = this.getAttribute('data-id');
                    abrirModalDevolucion(prestamoId);
                });
            });
            
        } catch (error) {
            console.error('Error:', error);
            prestamosContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error al cargar los préstamos. Por favor, intenta nuevamente.</p>
                </div>
            `;
        }
    }
    
    /**
     * Aplica los filtros ingresados por el usuario
     */
    function aplicarFiltros() {
        filtros.usuario = buscarUsuario.value.trim();
        filtros.libro = buscarLibro.value.trim();
        filtros.estado = estadoFiltro.value;
        
        // Reiniciar paginación
        paginaActual = 1;
        
        // Cargar préstamos con los nuevos filtros
        cargarPrestamos();
    }
    
    /**
     * Configura la paginación según el total de páginas
     * @param {number} totalPaginas - Total de páginas
     * @param {number} paginaActual - Página actual
     */
    function configurarPaginacion(totalPaginas, paginaActual) {
        paginacion.innerHTML = '';
        
        if (totalPaginas <= 1) {
            return;
        }
        
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
}

/**
 * Cambia a la página especificada y actualiza los préstamos
 * @param {number} pagina - Número de página
 */
function cambiarPagina(pagina) {
    paginaActual = pagina;
    cargarPrestamos();
    // Hacer scroll al inicio del contenedor
    prestamosContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Abre el modal para realizar un nuevo préstamo
 */
function abrirModalNuevoPrestamo() {
    // Obtener el modal
    const modalNuevoPrestamo = document.getElementById('modal-nuevo-prestamo');
    
    // Mostrar el modal
    modalNuevoPrestamo.classList.remove('hidden');
    
    // Limpiar campos del formulario si existen
    const form = modalNuevoPrestamo.querySelector('form');
    if (form) form.reset();
    
    // Configurar event listeners para cerrar modal
    const closeButtons = modalNuevoPrestamo.querySelectorAll('.modal-close, .btn-cancelar');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modalNuevoPrestamo.classList.add('hidden');
        });
    });
    
    // Configurar event listener para el formulario
    if (form) {
        form.removeEventListener('submit', procesarNuevoPrestamo);
        form.addEventListener('submit', procesarNuevoPrestamo);
    }
}

/**
 * Abre el modal para registrar una devolución
 * @param {string} prestamoId - ID del préstamo a devolver (opcional)
 */
function abrirModalDevolucion(prestamoId = null) {
    // Obtener el modal
    const modalDevolucion = document.getElementById('modal-devolucion');
    
    // Mostrar el modal
    modalDevolucion.classList.remove('hidden');
    
    // Si se proporcionó un ID de préstamo, cargar sus datos
    if (prestamoId) {
        const inputPrestamoId = modalDevolucion.querySelector('#prestamo-id');
        if (inputPrestamoId) inputPrestamoId.value = prestamoId;
        
        // Cargar información del préstamo
        cargarInfoPrestamo(prestamoId);
    } else {
        // Limpiar campos del formulario si existen
        const form = modalDevolucion.querySelector('form');
        if (form) form.reset();
    }
    
    // Configurar event listeners para cerrar modal
    const closeButtons = modalDevolucion.querySelectorAll('.modal-close, .btn-cancelar');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modalDevolucion.classList.add('hidden');
        });
    });
    
    // Configurar event listener para el formulario
    const form = modalDevolucion.querySelector('form');
    if (form) {
        form.removeEventListener('submit', procesarDevolucion);
        form.addEventListener('submit', procesarDevolucion);
    }
}

/**
 * Carga la información de un préstamo para el modal de devolución
 * @param {string} prestamoId - ID del préstamo
 */
async function cargarInfoPrestamo(prestamoId) {
    try {
        const response = await fetch(`/api/prestamos/${prestamoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar información del préstamo');
        }
        
        const data = await response.json();
        
        // Rellenar la información en el modal
        const modal = document.getElementById('modal-devolucion');
        const infoContainer = modal.querySelector('.prestamo-info');
        
        if (infoContainer) {
            const fechaPrestamo = new Date(data.fechaPrestamo).toLocaleDateString();
            const fechaDevolucion = new Date(data.fechaDevolucion).toLocaleDateString();
            
            infoContainer.innerHTML = `
                <p><strong>Libro:</strong> ${data.libro.titulo}</p>
                <p><strong>Usuario:</strong> ${data.usuario.nombre} ${data.usuario.apellido}</p>
                <p><strong>Fecha de préstamo:</strong> ${fechaPrestamo}</p>
                <p><strong>Fecha de devolución:</strong> ${fechaDevolucion}</p>
                <p><strong>Estado:</strong> <span class="status-badge ${data.estado === 'vencido' ? 'status-overdue' : 'status-active'}">${data.estado}</span></p>
            `;
        }
        
    } catch (error) {
        console.error('Error:', error);
        const modal = document.getElementById('modal-devolucion');
        const infoContainer = modal.querySelector('.prestamo-info');
        
        if (infoContainer) {
            infoContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error al cargar información del préstamo.</p>
                </div>
            `;
        }
    }
}

/**
 * Procesa el formulario de nuevo préstamo
 * @param {Event} event - Evento de submit
 */
async function procesarNuevoPrestamo(event) {
    event.preventDefault();
    
    // Obtener datos del formulario
    const form = event.target;
    const formData = new FormData(form);
    const prestamo = Object.fromEntries(formData.entries());
    
    try {
        // Mostrar indicador de carga
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        
        // Enviar datos al servidor
        const response = await fetch('/api/prestamos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(prestamo)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al procesar el préstamo');
        }
        
        // Ocultar modal
        document.getElementById('modal-nuevo-prestamo').classList.add('hidden');
        
        // Recargar préstamos
        cargarPrestamos();
        
        // Mostrar mensaje de éxito
        mostrarNotificacion('Préstamo registrado con éxito');
        
    } catch (error) {
        console.error('Error:', error);
        
        // Mostrar mensaje de error en el formulario
        const errorContainer = form.querySelector('.error-message') || document.createElement('div');
        errorContainer.classList.add('error-message');
        errorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
        
        if (!form.querySelector('.error-message')) {
            form.appendChild(errorContainer);
        }
        
        // Restaurar botón
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * Procesa el formulario de devolución de préstamo
 * @param {Event} event - Evento de submit
 */
async function procesarDevolucion(event) {
    event.preventDefault();
    
    // Obtener datos del formulario
    const form = event.target;
    const formData = new FormData(form);
    const datos = Object.fromEntries(formData.entries());
    
    try {
        // Mostrar indicador de carga
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        
        // Enviar datos al servidor
        const response = await fetch(`/api/prestamos/${datos.prestamoId}/devolver`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                estado: datos.estado,
                observaciones: datos.observaciones
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al procesar la devolución');
        }
        
        // Ocultar modal
        document.getElementById('modal-devolucion').classList.add('hidden');
        
        // Recargar préstamos
        cargarPrestamos();
        
        // Mostrar mensaje de éxito
        mostrarNotificacion('Devolución registrada con éxito');
        
    } catch (error) {
        console.error('Error:', error);
        
        // Mostrar mensaje de error en el formulario
        const errorContainer = form.querySelector('.error-message') || document.createElement('div');
        errorContainer.classList.add('error-message');
        errorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
        
        if (!form.querySelector('.error-message')) {
            form.appendChild(errorContainer);
        }
        
        // Restaurar botón
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * Ver detalles de un préstamo específico
 * @param {string} prestamoId - ID del préstamo
 */
async function verDetallesPrestamo(prestamoId) {
    try {
        const response = await fetch(`/api/prestamos/${prestamoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar detalles del préstamo');
        }
        
        const data = await response.json();
        
        // Crear y mostrar un modal con los detalles
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.id = 'modal-detalles-prestamo';
        
        const fechaPrestamo = new Date(data.fechaPrestamo).toLocaleDateString();
        const fechaDevolucion = new Date(data.fechaDevolucion).toLocaleDateString();
        const fechaDevolucionReal = data.fechaDevolucionReal ? new Date(data.fechaDevolucionReal).toLocaleDateString() : 'No devuelto';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detalles del Préstamo</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detalles-prestamo">
                        <h4>${data.libro.titulo}</h4>
                        <p><strong>Ejemplar:</strong> ${data.ejemplar ? data.ejemplar.codigoBarras : 'No disponible'}</p>
                        <p><strong>Usuario:</strong> ${data.usuario.nombre} ${data.usuario.apellido}</p>
                        <p><strong>Tipo de usuario:</strong> ${data.usuario.tipoUsuario}</p>
                        <p><strong>Fecha de préstamo:</strong> ${fechaPrestamo}</p>
                        <p><strong>Fecha de devolución esperada:</strong> ${fechaDevolucion}</p>
                        <p><strong>Fecha de devolución real:</strong> ${fechaDevolucionReal}</p>
                        <p><strong>Estado:</strong> <span class="status-badge ${getEstadoClass(data.estado)}">${data.estado}</span></p>
                        ${data.observaciones ? `<p><strong>Observaciones:</strong> ${data.observaciones}</p>` : ''}
                        ${data.multa ? `
                            <div class="multa-info">
                                <p><strong>Multa:</strong> $${data.multa.monto.toFixed(2)}</p>
                                <p><strong>Estado de multa:</strong> ${data.multa.pagada ? 'Pagada' : 'Pendiente'}</p>
                                ${data.multa.fechaPago ? `<p><strong>Fecha de pago:</strong> ${new Date(data.multa.fechaPago).toLocaleDateString()}</p>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close">Cerrar</button>
                    ${data.estado === 'activo' || data.estado === 'vencido' ? 
                        `<button class="btn btn-primary btn-devolver-detalle" data-id="${data.id}">Registrar Devolución</button>` : ''}
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
        
        // Configurar event listener para botón de devolución
        const btnDevolver = modal.querySelector('.btn-devolver-detalle');
        if (btnDevolver) {
            btnDevolver.addEventListener('click', () => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                    abrirModalDevolucion(prestamoId);
                }, 300);
            });
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar detalles del préstamo', 'error');
    }
}

/**
 * Obtiene la clase CSS para el estado de un préstamo
 * @param {string} estado - Estado del préstamo
 * @returns {string} - Clase CSS correspondiente
 */
function getEstadoClass(estado) {
    switch (estado) {
        case 'activo':
            return 'status-active';
        case 'vencido':
            return 'status-overdue';
        case 'devuelto':
            return 'status-returned';
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