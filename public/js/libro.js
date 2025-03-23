// public/js/libro.js
document.addEventListener('DOMContentLoaded', function() {
    // Ocultar el breadcrumb
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        breadcrumb.style.display = 'none';
    }

    // Elementos DOM
    const libroTitulo = document.getElementById('libro-titulo');
    const libroTituloCompleto = document.getElementById('libro-titulo-completo');
    const libroAutor = document.getElementById('libro-autor');
    const libroImagen = document.getElementById('libro-imagen');
    const libroISBN = document.getElementById('libro-isbn');
    const libroEditorial = document.getElementById('libro-editorial');
    const libroAño = document.getElementById('libro-año');
    const libroPaginas = document.getElementById('libro-paginas');
    const libroCategorias = document.getElementById('libro-categorias');
    const libroEstado = document.getElementById('libro-estado');
    const libroDescripcion = document.getElementById('libro-descripcion');
    const libroTablaContenido = document.getElementById('libro-tabla-contenido');
    const ejemplaresDisponibles = document.getElementById('ejemplares-disponibles');
    const ejemplaresTotal = document.getElementById('ejemplares-total');
    const btnReservar = document.getElementById('btn-reservar');
    const btnVerEjemplares = document.getElementById('btn-ver-ejemplares');
    const tablaEjemplares = document.getElementById('tabla-ejemplares');
    const ejemplaresLista = document.getElementById('ejemplares-lista');
    
    // Elementos para la reserva
    const modalReserva = document.getElementById('modal-reserva');
    const btnCancelarReserva = document.getElementById('cancelar-reserva');
    const btnConfirmarReserva = document.getElementById('confirmar-reserva');
    const modalTituloLibro = document.getElementById('modal-titulo-libro');
    const cerrarModalX = document.getElementById('cerrar-modal-x');

    // Variables globales
    let libroActual = null;

    // Obtener el ID del libro de la URL
    const params = new URLSearchParams(window.location.search);
    const libroId = params.get('id');

    if (!libroId) {
        mostrarError('No se especificó un libro');
        return;
    }

    // Cargar los detalles del libro
    cargarDetallesLibro(libroId);

    // Event listener para el botón de reservar
    if (btnReservar) {
        btnReservar.addEventListener('click', function() {
            console.log('Botón de reservar clickeado'); // Debug
            
            // Verificar si hay usuario logueado
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
                return;
            }
            
            // Verificar si el libro está cargado
            if (!libroActual) {
                console.error('Información del libro no disponible');
                mostrarNotificacion('No se pudo cargar la información del libro', 'error');
                return;
            }
            
            // Abrir modal de confirmación si hay token
            if (modalTituloLibro) {
                modalTituloLibro.textContent = libroActual.Titulo;
            }
            if (modalReserva) {
                modalReserva.classList.remove('hidden');
            } else {
                console.error('Modal de reserva no encontrado');
            }
        });
    }

    if (btnVerEjemplares) {
        btnVerEjemplares.addEventListener('click', function() {
            if (tablaEjemplares.classList.contains('hidden')) {
                tablaEjemplares.classList.remove('hidden');
                this.textContent = 'Ocultar Ejemplares';
            } else {
                tablaEjemplares.classList.add('hidden');
                this.textContent = 'Ver Ejemplares';
            }
        });
    }
    
    // Event listeners para cerrar modal
    if (cerrarModalX) {
        cerrarModalX.addEventListener('click', function() {
            modalReserva.classList.add('hidden');
        });
    }
    
    if (btnCancelarReserva) {
        btnCancelarReserva.addEventListener('click', function() {
            modalReserva.classList.add('hidden');
        });
    }
    
    // Event listener para confirmar reserva
    if (btnConfirmarReserva) {
        btnConfirmarReserva.addEventListener('click', function() {
            realizarReserva();
        });
    }

    // Agregar event listener global para botones de reserva de ejemplares
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('btn-reservar-ejemplar')) {
            const ejemplarId = event.target.getAttribute('data-id');
            console.log("Botón de ejemplar clickeado, ID:", ejemplarId); // Depuración
            if (ejemplarId) {
                reservarEjemplar(ejemplarId);
            }
        }
    });

    // Función para cargar los detalles del libro
    async function cargarDetallesLibro(id) {
        try {
            const response = await fetch(`/api/libros/${id}`);
            
            if (!response.ok) {
                throw new Error('No se pudo cargar la información del libro');
            }
            
            const libro = await response.json();
            console.log('Datos del libro cargados:', libro); // Debug
            
            // Guardar para uso en la reserva
            libroActual = libro;
            
            // Actualizar la interfaz con los datos del libro
            document.title = `${libro.Titulo} - Biblioteca Escolar`;
            if (libroTitulo) libroTitulo.textContent = libro.Titulo;
            if (libroTituloCompleto) libroTituloCompleto.textContent = libro.Titulo;
            
            // Autor
            if (libroAutor && libro.autor) {
                libroAutor.textContent = `${libro.autor.Nombre} ${libro.autor.Apellido}`;
            }
            
            // Imagen de portada
            if (libroImagen) {
                if (libro.ImagenPortada && libro.ImagenPortada.trim() !== '') {
                    libroImagen.src = libro.ImagenPortada;
                    libroImagen.alt = libro.Titulo;
                } else {
                    // Usar imagen de portada por defecto
                    libroImagen.src = '/images/book-placeholder.png';
                    libroImagen.alt = `Portada no disponible - ${libro.Titulo}`;
                }
            }
            
            // Metadatos
            if (libroISBN) libroISBN.textContent = libro.ISBN || '-';
            
            if (libroEditorial && libro.editorial) {
                libroEditorial.textContent = libro.editorial.Nombre || '-';
            }
            
            if (libroAño) {
                if (libro.FechaPublicacion) {
                    const fecha = new Date(libro.FechaPublicacion);
                    libroAño.textContent = fecha.getFullYear();
                } else {
                    libroAño.textContent = '-';
                }
            }
            
            if (libroPaginas) libroPaginas.textContent = libro.Paginas || '-';
            
            // Categorías
            if (libroCategorias) {
                if (libro.categorias && libro.categorias.length > 0) {
                    libroCategorias.textContent = libro.categorias.map(cat => cat.Nombre).join(', ');
                } else {
                    libroCategorias.textContent = '-';
                }
            }
            
            // Descripción
            if (libroDescripcion) {
                if (libro.Descripcion) {
                    libroDescripcion.textContent = libro.Descripcion;
                } else {
                    libroDescripcion.innerHTML = '<p>No hay descripción disponible para este libro.</p>';
                }
            }
            
            // Tabla de contenido
            if (libroTablaContenido) {
                if (libro.TablaContenido) {
                    libroTablaContenido.textContent = libro.TablaContenido;
                } else {
                    libroTablaContenido.innerHTML = '<p>No hay tabla de contenido disponible para este libro.</p>';
                }
            }
            
            // Ejemplares y disponibilidad
            let disponibles = 0;
            let total = 0;
            
            if (libro.ejemplares && libro.ejemplares.length > 0) {
                total = libro.ejemplares.length;
                disponibles = libro.ejemplares.filter(ej => ej.Estado === 'Disponible').length;
                
                // Actualizar tabla de ejemplares
                if (ejemplaresLista) {
                    ejemplaresLista.innerHTML = '';
                    libro.ejemplares.forEach(ejemplar => {
                        const tr = document.createElement('tr');
                        
                        // Determinar si se puede reservar este ejemplar
                        const puedeReservar = ejemplar.Estado === 'Disponible';
                        
                        // Log de depuración para verificar IDs
                        console.log(`Ejemplar ID: ${ejemplar.EjemplarID}, Estado: ${ejemplar.Estado}`);
                        
                        tr.innerHTML = `
                            <td>${ejemplar.CodigoBarras}</td>
                            <td><span class="status-badge ${ejemplar.Estado === 'Disponible' ? 'status-available' : 'status-borrowed'}">${ejemplar.Estado}</span></td>
                            <td>${ejemplar.Condicion || '-'}</td>
                            <td>${ejemplar.Signatura || '-'}</td>
                            <td>
                                ${puedeReservar ? 
                                    `<button class="btn btn-sm btn-primary btn-reservar-ejemplar" data-id="${ejemplar.EjemplarID}">Reservar</button>` : 
                                    '<span class="status-text">No disponible</span>'
                                }
                            </td>
                        `;
                        ejemplaresLista.appendChild(tr);
                    });
                }
            }
            
            if (ejemplaresDisponibles) ejemplaresDisponibles.textContent = disponibles;
            if (ejemplaresTotal) ejemplaresTotal.textContent = total;
            
            // Actualizar estado de disponibilidad
            if (libroEstado && btnReservar) {
                if (disponibles > 0) {
                    libroEstado.textContent = 'Disponible';
                    libroEstado.className = 'status-badge status-available';
                    btnReservar.disabled = false;
                } else {
                    libroEstado.textContent = 'No disponible';
                    libroEstado.className = 'status-badge status-borrowed';
                    btnReservar.disabled = true;
                }
            }
            
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al cargar los datos del libro');
        }
    }

    // Función para realizar la reserva (general)
    async function realizarReserva() {
        try {
            if (!libroActual) {
                throw new Error('No se ha cargado la información del libro');
            }
            
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
                return;
            }
            
            // Deshabilitar botón y mostrar cargando
            btnConfirmarReserva.disabled = true;
            btnConfirmarReserva.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            
            // Enviar solicitud al servidor
            const response = await fetch('/api/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    LibroID: libroActual.LibroID,
                    Notas: "Reserva desde página de detalle del libro"
                })
            });
            
            // Restaurar botón
            btnConfirmarReserva.disabled = false;
            btnConfirmarReserva.innerHTML = 'Confirmar Reserva';
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al realizar la reserva');
            }
            
            // Cerrar modal
            modalReserva.classList.add('hidden');
            
            // Mostrar mensaje de éxito
            mostrarNotificacion('Reserva realizada con éxito. Puedes revisarla en "Mis Reservas".');
            
            // Actualizar contador de ejemplares disponibles
            const nuevaCantidad = parseInt(ejemplaresDisponibles.textContent) - 1;
            ejemplaresDisponibles.textContent = nuevaCantidad;
            
            // Si ya no hay ejemplares disponibles, deshabilitar botón
            if (nuevaCantidad <= 0) {
                btnReservar.disabled = true;
                libroEstado.textContent = 'No disponible';
                libroEstado.className = 'status-badge status-borrowed';
            }
            
            // Recargar la página después de un breve retraso
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message, 'error');
        }
    }
    
    // Función para reservar un ejemplar específico
    async function reservarEjemplar(ejemplarId) {
        try {
            // Añadir logs de depuración
            console.log("Intentando reservar ejemplar con ID:", ejemplarId);
            
            if (!ejemplarId || ejemplarId === '0') {
                throw new Error('ID de ejemplar inválido');
            }
            
            if (!libroActual) {
                throw new Error('No se ha cargado la información del libro');
            }
            
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
                return;
            }
            
            // Desactivar todos los botones de reserva mientras se procesa
            const botonesReserva = document.querySelectorAll('.btn-reservar-ejemplar');
            botonesReserva.forEach(btn => {
                btn.disabled = true;
                if (btn.getAttribute('data-id') === ejemplarId) {
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                }
            });
            
            // Implementación real de la reserva de ejemplar específico
            const response = await fetch('/api/reservas/ejemplar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    LibroID: libroActual.LibroID,
                    EjemplarID: parseInt(ejemplarId), // Asegurarse que sea un número
                    Notas: "Reserva de ejemplar específico"
                })
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                // Reactivar los botones
                botonesReserva.forEach(btn => {
                    btn.disabled = false;
                    if (btn.getAttribute('data-id') === ejemplarId) {
                        btn.innerHTML = 'Reservar';
                    }
                });
                
                throw new Error(responseData.message || 'Error al reservar ejemplar');
            }
            
            // Mostrar mensaje de éxito
            mostrarNotificacion('Ejemplar reservado con éxito. Puedes revisarlo en "Mis Reservas".');
            
            // Actualizar UI
            const boton = document.querySelector(`.btn-reservar-ejemplar[data-id="${ejemplarId}"]`);
            if (boton) {
                boton.disabled = true;
                boton.textContent = 'Reservado';
            }
            
            // Actualizar contador de ejemplares disponibles
            const nuevaCantidad = parseInt(ejemplaresDisponibles.textContent) - 1;
            ejemplaresDisponibles.textContent = nuevaCantidad;
            
            // Si ya no hay ejemplares disponibles, deshabilitar botón principal
            if (nuevaCantidad <= 0) {
                btnReservar.disabled = true;
                libroEstado.textContent = 'No disponible';
                libroEstado.className = 'status-badge status-borrowed';
            }
            
            // Recargar la página después de un breve retraso
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('Error al reservar ejemplar:', error);
            mostrarNotificacion(`Error: ${error.message}`, 'error');
        }
    }
    
    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo = 'success') {
        // Buscar o crear contenedor de notificación
        let toast = document.getElementById('notification-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'notification-toast';
            toast.classList.add('notification');
            document.body.appendChild(toast);
        }
        
        // Crear contenido
        toast.innerHTML = `
            <div class="notification-content ${tipo}">
                <span id="notification-message">${mensaje}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Mostrar notificación
        toast.classList.remove('hidden');
        
        // Configurar cierre
        const closeBtn = toast.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                toast.classList.add('hidden');
            });
        }
        
        // Auto-cerrar después de 5 segundos
        setTimeout(function() {
            toast.classList.add('hidden');
        }, 5000);
    }

    // Función para mostrar errores
    function mostrarError(mensaje) {
        const contenedor = document.querySelector('.libro-detalle');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="error-message">
                    <h3>Error</h3>
                    <p>${mensaje}</p>
                    <a href="/catalogo.html" class="btn">Volver al catálogo</a>
                </div>
            `;
        } else {
            console.error('Error:', mensaje);
            alert(`Error: ${mensaje}`);
        }
    }
});