document.addEventListener('DOMContentLoaded', function() {
    console.log("Prestamos.js loaded, checking authentication");
    
    // Verificar autenticación y permisos de administrador
    if (!window.AuthService || !window.AuthService.isAuthenticated()) {
        console.log("User not authenticated, redirecting to login");
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }
    
    // Verificar si el usuario tiene permisos de admin o bibliotecario
    if (!window.AuthService.isAdmin() && !window.AuthService.hasRole('bibliotecario')) {
        console.log("User does not have admin privileges, redirecting");
        window.location.href = '/acceso-denegado.html';
        return;
    }
    
    console.log("User has required permissions, continuing");
    
    // Obtener token para las solicitudes API
    const token = window.AuthService.getToken();
    
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
                // Si el error es de autorización, puede que el token haya expirado
                if (response.status === 401 || response.status === 403) {
                    console.log("Authorization error, logging out");
                    window.AuthService.logout(); // Cerrar sesión y redirigir al login
                    return;
                }
                throw new Error('Error al cargar préstamos');
            }
            
            const data = await response.json();
            console.log("Datos recibidos:", data); // Para depuración
            
            // Vaciar contenedor
            prestamosContainer.innerHTML = '';
            
            // Verificar la estructura de la respuesta
            const prestamos = data.prestamos || data;
            
            // Si no hay préstamos, mostrar mensaje
            if (!prestamos || prestamos.length === 0) {
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
            prestamos.forEach(prestamo => {
                // Adaptamos el acceso a las propiedades según la estructura real que recibimos
                const ejemplar = prestamo.ejemplar || {};
                const libro = ejemplar.libro || {};
                const autor = libro.autor || {};
                const usuario = prestamo.usuario || { nombre: "Usuario", apellido: "Desconocido" };
                
                const fechaPrestamo = new Date(prestamo.FechaPrestamo || prestamo.fechaPrestamo).toLocaleDateString();
                const fechaDevolucion = new Date(prestamo.FechaDevolucion || prestamo.fechaDevolucion).toLocaleDateString();
                
                // Determinar estado (respetando la capitalización de la BD)
                const estado = prestamo.Estado || prestamo.estado || "activo";
                
                const prestamoElement = document.createElement('div');
                prestamoElement.classList.add('prestamo-card');
                prestamoElement.classList.add(`estado-${estado.toLowerCase()}`);
                
                // Determinar clase de estado
                let estadoClass = '';
                switch (estado.toLowerCase()) {
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
                        <h3 class="prestamo-titulo">${libro.Titulo || libro.titulo || "Título no disponible"}</h3>
                        <p class="prestamo-usuario">Usuario: ${usuario.nombre || ""} ${usuario.apellido || ""}</p>
                        <div class="prestamo-fechas">
                            <div class="fecha-grupo">
                                <span class="fecha-etiqueta">Préstamo</span>
                                <span class="fecha-valor">${fechaPrestamo}</span>
                            </div>
                            <div class="fecha-grupo">
                                <span class="fecha-etiqueta">Devolución</span>
                                <span class="fecha-valor">${fechaDevolucion}</span>
                            </div>
                        </div>
                        <p>Autor: ${autor.Nombre || autor.nombre || ""} ${autor.Apellido || autor.apellido || ""}</p>
                        <p>Ejemplar: ${ejemplar.CodigoBarras || ejemplar.codigoBarras || "N/A"}</p>
                        <div class="prestamo-estado">
                            <span class="status-badge ${estadoClass}">${estado}</span>
                        </div>
                    </div>
                    <div class="prestamo-acciones">
                        <button class="btn btn-sm btn-secondary btn-detalles" data-id="${prestamo.PrestamoID || prestamo.prestamoID || prestamo.id}">
                            <i class="fas fa-info-circle"></i> Detalles
                        </button>
                        ${['activo', 'vencido', 'Activo', 'Vencido'].includes(estado) ? 
                            `<button class="btn btn-sm btn-primary btn-devolver" data-id="${prestamo.PrestamoID || prestamo.prestamoID || prestamo.id}">
                                <i class="fas fa-undo"></i> Devolver
                            </button>` : ''
                        }
                    </div>
                `;
                
                prestamosContainer.appendChild(prestamoElement);
            });
            
            // Configurar paginación si existe la información de página
            if (data.totalPaginas) {
                configurarPaginacion(data.totalPaginas, data.paginaActual);
            } else {
                paginacion.innerHTML = '';
            }
            
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
                    <p>Error al cargar los préstamos: ${error.message}. Por favor, intenta nuevamente.</p>
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

        console.log("✅ abrirModalDevolucion ejecutada");
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
        const closeButtons = modalDevolucion.querySelectorAll('.modal-close, #btn-cancelar-devolucion');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modalDevolucion.classList.add('hidden');
            });
        });
        
        // Configurar event listener para el formulario
        const form = modalDevolucion.querySelector('form');
        if (form) {
            form.removeEventListener('submit', procesarDevolucion);
            form.addEventListener('submit', (e) => procesarDevolucion(e));
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
                // Si el error es de autorización, cerrar sesión
                if (response.status === 401 || response.status === 403) {
                    window.AuthService.logout();
                    return;
                }
                throw new Error('Error al cargar información del préstamo');
            }
            
            const data = await response.json();
            console.log("Información del préstamo:", data); // Para depuración
            
            // Adaptar acceso a las propiedades según la estructura real
            const ejemplar = data.ejemplar || {};
            const libro = ejemplar.libro || {};
            const usuario = data.usuario || { nombre: "Usuario", apellido: "Desconocido" };
            const estado = data.Estado || data.estado || "activo";
            
            // Rellenar la información en el modal
            const modal = document.getElementById('modal-devolucion');
            const infoContainer = modal.querySelector('.prestamo-info');
            
            if (infoContainer) {
                const fechaPrestamo = new Date(data.FechaPrestamo || data.fechaPrestamo).toLocaleDateString();
                const fechaDevolucion = new Date(data.FechaDevolucion || data.fechaDevolucion).toLocaleDateString();
                
                let estadoClass = '';
                if (estado.toLowerCase() === 'vencido') {
                    estadoClass = 'status-overdue';
                } else {
                    estadoClass = 'status-active';
                }
                
                infoContainer.innerHTML = `
                    <p><strong>Libro:</strong> ${libro.Titulo || libro.titulo || "No disponible"}</p>
                    <p><strong>Usuario:</strong> ${usuario.nombre || ""} ${usuario.apellido || ""}</p>
                    <p><strong>Ejemplar:</strong> ${ejemplar.CodigoBarras || ejemplar.codigoBarras || "No disponible"}</p>
                    <p><strong>Fecha de préstamo:</strong> ${fechaPrestamo}</p>
                    <p><strong>Fecha de devolución:</strong> ${fechaDevolucion}</p>
                    <p><strong>Estado:</strong> <span class="status-badge ${estadoClass}">${estado}</span></p>
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
                        <p>Error al cargar información del préstamo: ${error.message}</p>
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
            // Guardar el texto original del botón
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Mostrar indicador de carga
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
                // Manejar error de autorización
                if (response.status === 401 || response.status === 403) {
                    window.AuthService.logout();
                    return;
                }
                
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
            submitBtn.innerHTML = originalText || 'Registrar Préstamo';
        }
    }

    /**
     * Procesa el formulario de devolución de préstamo
     * @param {Event} event - Evento de submit
     */
    async function procesarDevolucion(event) {
        event.preventDefault();
        
        console.log("➡️ Se disparó el submit de devolución");

        // Obtener datos del formulario
        const form = event.target;
        const formData = new FormData(form);
        const datos = Object.fromEntries(formData.entries());
        
        try {
            // Guardar el texto original del botón
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Mostrar indicador de carga
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            
            // Enviar datos al servidor
            const response = await fetch(`/api/prestamos/${datos.prestamoId}/devolucion`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    Condicion: datos.condicion || 'Bueno',
                    Notas: datos.notas || ''
                })
            });
            
            if (!response.ok) {
                // Manejar error de autorización
                if (response.status === 401 || response.status === 403) {
                    window.AuthService.logout();
                    return;
                }
                
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
            submitBtn.innerHTML = originalText || 'Registrar Devolución';
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
                // Manejar error de autorización
                if (response.status === 401 || response.status === 403) {
                    window.AuthService.logout();
                    return;
                }
                throw new Error('Error al cargar detalles del préstamo');
            }
            
            const data = await response.json();

            // Prellenar campos del formulario de devolución
            const form = document.querySelector('#modal-devolucion form');
            if (form) {
                const inputPrestamoId = form.querySelector('[name="prestamoId"]');
                const inputCodigo = form.querySelector('[name="codigo"]');
                const inputCondicion = form.querySelector('[name="condicion"]');
                const inputNotas = form.querySelector('[name="notas"]');
    
                if (inputPrestamoId) inputPrestamoId.value = data.PrestamoID;
                if (inputCodigo) inputCodigo.value = data.ejemplar?.CodigoBarras || '';
                if (inputCondicion) inputCondicion.value = data.ejemplar?.Condicion || 'Bueno';
                if (inputNotas) inputNotas.value = data.Notas || '';
            }


            console.log("Detalles del préstamo:", data); // Para depuración
            
            // Adaptar acceso a las propiedades según la estructura real
            const ejemplar = data.ejemplar || {};
            const libro = ejemplar.libro || {};
            const autor = libro.autor || {};
            const usuario = data.usuario || { nombre: "Usuario", apellido: "Desconocido" };
            const estado = data.Estado || data.estado || "activo";
            
            // Crear y mostrar un modal con los detalles
            const modal = document.createElement('div');
            modal.classList.add('modal');
            modal.id = 'modal-detalles-prestamo';
            
            const fechaPrestamo = new Date(data.FechaPrestamo || data.fechaPrestamo).toLocaleDateString();
            const fechaDevolucion = new Date(data.FechaDevolucion || data.fechaDevolucion).toLocaleDateString();
            const fechaDevolucionReal = data.FechaDevolucionReal || data.fechaDevolucionReal 
                ? new Date(data.FechaDevolucionReal || data.fechaDevolucionReal).toLocaleDateString() 
                : 'No devuelto';
            
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalles del Préstamo</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detalles-prestamo">
                            <h4>${libro.Titulo || libro.titulo || "Título no disponible"}</h4>
                            <p><strong>Autor:</strong> ${autor.Nombre || autor.nombre || ""} ${autor.Apellido || autor.apellido || ""}</p>
                            <p><strong>Ejemplar:</strong> ${ejemplar.CodigoBarras || ejemplar.codigoBarras || "No disponible"}</p>
                            <p><strong>Usuario:</strong> ${usuario.nombre || ""} ${usuario.apellido || ""}</p>
                            <p><strong>Tipo de usuario:</strong> ${usuario.tipo_usuario || usuario.tipoUsuario || "No disponible"}</p>
                            <p><strong>Fecha de préstamo:</strong> ${fechaPrestamo}</p>
                            <p><strong>Fecha de devolución esperada:</strong> ${fechaDevolucion}</p>
                            <p><strong>Fecha de devolución real:</strong> ${fechaDevolucionReal}</p>
                            <p><strong>Estado:</strong> <span class="status-badge ${getEstadoClass(estado)}">${estado}</span></p>
                            ${data.Notas || data.notas ? `<p><strong>Observaciones:</strong> ${data.Notas || data.notas}</p>` : ''}
                            ${data.multa ? `
                                <div class="multa-info">
                                    <p><strong>Multa:</strong> $${(data.multa.monto || data.MultaImporte || 0).toFixed(2)}</p>
                                    <p><strong>Estado de multa:</strong> ${data.multa.pagada || data.MultaPagada ? 'Pagada' : 'Pendiente'}</p>
                                    ${data.multa.fechaPago ? `<p><strong>Fecha de pago:</strong> ${new Date(data.multa.fechaPago).toLocaleDateString()}</p>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary modal-close">Cerrar</button>
                        ${['activo', 'vencido', 'Activo', 'Vencido'].includes(estado) ? 
                            `<button class="btn btn-primary btn-devolver-detalle" data-id="${data.PrestamoID || data.prestamoID || data.id}">Registrar Devolución</button>` : ''}
                    </div>
                </div>
            `;
            
            // Añadir el modal al DOM
            document.body.appendChild(modal);
            
            // Mostrar el modal
            setTimeout(() => {
                modal.classList.remove('hidden');
            }, 10);
            
            // Configurar event listeners para cerrar modal
            modal.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                    setTimeout(() => {
                        modal.remove();
                    }, 300);
                });
            });
            
            // Configurar event listener para botón de devolución
            const btnDevolver = modal.querySelector('.btn-devolver-detalle');
            if (btnDevolver) {
                btnDevolver.addEventListener('click', () => {
                    modal.classList.add('hidden');
                    setTimeout(() => {
                        modal.remove();
                        abrirModalDevolucion(prestamoId);
                    }, 300);
                });
            }
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar detalles del préstamo: ' + error.message, 'error');
        }
    }

    /**
     * Obtiene la clase CSS para el estado de un préstamo
     * @param {string} estado - Estado del préstamo
     * @returns {string} - Clase CSS correspondiente
     */
    function getEstadoClass(estado) {
        switch (estado.toLowerCase()) {
            case 'activo':
                return 'status-active';
            case 'vencido':
                return 'status-overdue';
            case 'devuelto':
                return 'status-returned';
            case 'perdido':
                return 'status-lost';
            case 'dañado':
                return 'status-damaged';
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
    try {
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
                if (notificacionItem.parentNode) {
                    notificacionItem.remove();
                }
            }, 300);
        });
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            if (notificacionItem && notificacionItem.parentNode) {
                notificacionItem.classList.add('notification-hide');
                setTimeout(() => {
                    if (notificacionItem.parentNode) {
                        notificacionItem.remove();
                    }
                }, 300);
            }
        }, 5000);
    } catch (error) {
        console.error("Error al mostrar notificación:", error);
        // Fallback a alert en caso de error
        alert(`${tipo.toUpperCase()}: ${mensaje}`);
    }
 }
 
 /**
 * Inicializa la búsqueda de usuarios para el formulario de préstamo
 */
 function inicializarBusquedaUsuarios() {
    const searchUsuario = document.getElementById('buscar-usuario-prestamo');
    const resultsUsuario = document.getElementById('resultados-usuario');
    const selectedUsuario = document.getElementById('usuario-seleccionado');
    const inputUsuarioId = document.getElementById('usuario-id');
    
    if (!searchUsuario) return;
    
    // Event listener para buscar usuarios mientras se escribe
    searchUsuario.addEventListener('input', debounce(async function() {
        const query = this.value.trim();
        if (query.length < 3) {
            resultsUsuario.innerHTML = '';
            resultsUsuario.classList.remove('active');
            return;
        }
        
        try {
            const response = await fetch(`/api/usuarios/buscar?query=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    window.AuthService.logout();
                    return;
                }
                throw new Error('Error al buscar usuarios');
            }
            
            const usuarios = await response.json();
            
            // Mostrar resultados
            resultsUsuario.innerHTML = '';
            if (usuarios.length === 0) {
                resultsUsuario.innerHTML = '<div class="search-item">No se encontraron resultados</div>';
            } else {
                usuarios.forEach(usuario => {
                    const item = document.createElement('div');
                    item.classList.add('search-item');
                    item.innerHTML = `${usuario.nombre} ${usuario.apellido} (${usuario.tipo_usuario})`;
                    item.addEventListener('click', () => {
                        // Seleccionar usuario
                        inputUsuarioId.value = usuario.id;
                        searchUsuario.value = `${usuario.nombre} ${usuario.apellido}`;
                        selectedUsuario.innerHTML = `
                            <div>${usuario.nombre} ${usuario.apellido}</div>
                            <div><small>${usuario.email}</small></div>
                            <div><small>${usuario.tipo_usuario}</small></div>
                        `;
                        selectedUsuario.classList.remove('hidden');
                        resultsUsuario.classList.remove('active');
                    });
                    resultsUsuario.appendChild(item);
                });
            }
            
            resultsUsuario.classList.add('active');
            
        } catch (error) {
            console.error('Error:', error);
            resultsUsuario.innerHTML = `<div class="search-item error">Error: ${error.message}</div>`;
            resultsUsuario.classList.add('active');
        }
    }, 300));
    
    // Ocultar resultados al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!searchUsuario.contains(e.target) && !resultsUsuario.contains(e.target)) {
            resultsUsuario.classList.remove('active');
        }
    });
 }
 
 /**
 * Inicializa la búsqueda de ejemplares para el formulario de préstamo
 */
 function inicializarBusquedaEjemplares() {
    const searchEjemplar = document.getElementById('buscar-ejemplar');
    const resultsEjemplar = document.getElementById('resultados-ejemplar');
    const selectedEjemplar = document.getElementById('ejemplar-seleccionado');
    const inputEjemplarId = document.getElementById('ejemplar-id');
    
    if (!searchEjemplar) return;
    
    // Event listener para buscar ejemplares mientras se escribe
    searchEjemplar.addEventListener('input', debounce(async function() {
        const query = this.value.trim();
        if (query.length < 3) {
            resultsEjemplar.innerHTML = '';
            resultsEjemplar.classList.remove('active');
            return;
        }
        
        try {
            const response = await fetch(`/api/ejemplares/buscar?query=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    window.AuthService.logout();
                    return;
                }
                throw new Error('Error al buscar ejemplares');
            }
            
            const ejemplares = await response.json();
            
            // Mostrar resultados
            resultsEjemplar.innerHTML = '';
            if (ejemplares.length === 0) {
                resultsEjemplar.innerHTML = '<div class="search-item">No se encontraron resultados</div>';
            } else {
                ejemplares.forEach(ejemplar => {
                    if (ejemplar.Estado === 'Disponible' || ejemplar.estado === 'Disponible') {
                        const item = document.createElement('div');
                        item.classList.add('search-item');
                        
                        const libro = ejemplar.libro || {};
                        const titulo = libro.Titulo || libro.titulo || "Sin título";
                        
                        item.innerHTML = `${ejemplar.CodigoBarras || ejemplar.codigoBarras} - ${titulo}`;
                        item.addEventListener('click', () => {
                            // Seleccionar ejemplar
                            inputEjemplarId.value = ejemplar.EjemplarID || ejemplar.ejemplarID || ejemplar.id;
                            searchEjemplar.value = ejemplar.CodigoBarras || ejemplar.codigoBarras;
                            selectedEjemplar.innerHTML = `
                                <div><strong>${titulo}</strong></div>
                                <div>Código: ${ejemplar.CodigoBarras || ejemplar.codigoBarras}</div>
                                <div><small>Estado: ${ejemplar.Estado || ejemplar.estado}</small></div>
                            `;
                            selectedEjemplar.classList.remove('hidden');
                            resultsEjemplar.classList.remove('active');
                        });
                        resultsEjemplar.appendChild(item);
                    }
                });
                
                // Si no hay ejemplares disponibles después de filtrar
                if (resultsEjemplar.children.length === 0) {
                    resultsEjemplar.innerHTML = '<div class="search-item">No hay ejemplares disponibles</div>';
                }
            }
            
            resultsEjemplar.classList.add('active');
            
        } catch (error) {
            console.error('Error:', error);
            resultsEjemplar.innerHTML = `<div class="search-item error">Error: ${error.message}</div>`;
            resultsEjemplar.classList.add('active');
        }
    }, 300));
    
    // Ocultar resultados al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!searchEjemplar.contains(e.target) && !resultsEjemplar.contains(e.target)) {
            resultsEjemplar.classList.remove('active');
        }
    });
 }
 
 /**
 * Función debounce para controlar la frecuencia de eventos
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en milisegundos
 * @returns {Function} - Función con debounce
 */
 function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
 }
 
 /**
 * Inicializa la sección de plazos de devolución para el formulario de préstamo
 */
 function inicializarPlazoPrestamo() {
    const tipoPrestamo = document.getElementById('tipo-prestamo');
    const fechaDevolucion = document.getElementById('fecha-devolucion');
    const diasPrestamo = document.getElementById('dias-prestamo');
    
    if (!tipoPrestamo || !fechaDevolucion || !diasPrestamo) return;
    
    tipoPrestamo.addEventListener('change', function() {
        // Modificar días según el tipo de préstamo
        if (this.value === 'normal') {
            diasPrestamo.value = 7; // 7 días para préstamo normal
        } else if (this.value === 'largo') {
            diasPrestamo.value = 14; // 14 días para préstamo largo
        } else if (this.value === 'corto') {
            diasPrestamo.value = 3; // 3 días para préstamo corto
        }
        
        // Actualizar fecha de devolución
        actualizarFechaDevolucion();
    });
    
    diasPrestamo.addEventListener('change', actualizarFechaDevolucion);
    
    // Actualizar fecha inicial
    actualizarFechaDevolucion();
    
    function actualizarFechaDevolucion() {
        const dias = parseInt(diasPrestamo.value) || 7;
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + dias);
        
        // Formatear fecha para input date (YYYY-MM-DD)
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        
        fechaDevolucion.value = `${year}-${month}-${day}`;
    }
 }
 
 /**
 * Inicializa todos los componentes interactivos
 */
 function inicializarComponentes() {
    inicializarBusquedaUsuarios();
    inicializarBusquedaEjemplares();
    inicializarPlazoPrestamo();
 }
 
 // Inicializar componentes cuando el DOM esté listo
 inicializarComponentes();
 });