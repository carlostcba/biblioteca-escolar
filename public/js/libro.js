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

    // Obtener el ID del libro de la URL
    const params = new URLSearchParams(window.location.search);
    const libroId = params.get('id');

    if (!libroId) {
        mostrarError('No se especificó un libro');
        return;
    }

    // Cargar los detalles del libro
    cargarDetallesLibro(libroId);

    // Event listeners
    btnReservar.addEventListener('click', function() {
        // Verificar si hay ejemplares disponibles
        if (parseInt(ejemplaresDisponibles.textContent) > 0) {
            const modal = document.getElementById('modal-reserva');
            if (modal) {
                modal.classList.remove('hidden');
                // Aquí iría más código para configurar el modal
            } else {
                alert('Funcionalidad de reserva en desarrollo');
            }
        } else {
            alert('No hay ejemplares disponibles para reservar');
        }
    });

    btnVerEjemplares.addEventListener('click', function() {
        if (tablaEjemplares.classList.contains('hidden')) {
            tablaEjemplares.classList.remove('hidden');
            this.textContent = 'Ocultar Ejemplares';
        } else {
            tablaEjemplares.classList.add('hidden');
            this.textContent = 'Ver Ejemplares';
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
            console.log('Datos del libro:', libro);
            
            // Actualizar la interfaz con los datos del libro
            document.title = `${libro.Titulo} - Biblioteca Escolar`;
            libroTitulo.textContent = libro.Titulo;
            libroTituloCompleto.textContent = libro.Titulo;
            
            // Autor
            if (libro.autor) {
                libroAutor.textContent = `${libro.autor.Nombre} ${libro.autor.Apellido}`;
            }
            
            // Imagen de portada
            if (libro.ImagenPortada && libro.ImagenPortada.trim() !== '') {
                 libroImagen.src = libro.ImagenPortada;
                 libroImagen.alt = libro.Titulo;
            } else {
          // Usar imagen de portada por defecto
                 libroImagen.src = '/images/book-placeholder.png';
                 libroImagen.alt = `Portada no disponible - ${libro.Titulo}`;
            }
            
            // Metadatos
            libroISBN.textContent = libro.ISBN || '-';
            
            if (libro.editorial) {
                libroEditorial.textContent = libro.editorial.Nombre || '-';
            }
            
            if (libro.FechaPublicacion) {
                const fecha = new Date(libro.FechaPublicacion);
                libroAño.textContent = fecha.getFullYear();
            } else {
                libroAño.textContent = '-';
            }
            
            libroPaginas.textContent = libro.Paginas || '-';
            
            // Categorías
            if (libro.categorias && libro.categorias.length > 0) {
                libroCategorias.textContent = libro.categorias.map(cat => cat.Nombre).join(', ');
            } else {
                libroCategorias.textContent = '-';
            }
            
            // Descripción
            if (libro.Descripcion) {
                libroDescripcion.textContent = libro.Descripcion;
            } else {
                libroDescripcion.innerHTML = '<p>No hay descripción disponible para este libro.</p>';
            }
            
            // Tabla de contenido
            if (libro.TablaContenido) {
                libroTablaContenido.textContent = libro.TablaContenido;
            } else {
                libroTablaContenido.innerHTML = '<p>No hay tabla de contenido disponible para este libro.</p>';
            }
            
            // Ejemplares y disponibilidad
            let disponibles = 0;
            let total = 0;
            
            if (libro.ejemplares && libro.ejemplares.length > 0) {
                total = libro.ejemplares.length;
                disponibles = libro.ejemplares.filter(ej => ej.Estado === 'Disponible').length;
                
                // Actualizar tabla de ejemplares
                ejemplaresLista.innerHTML = '';
                libro.ejemplares.forEach(ejemplar => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${ejemplar.CodigoBarras}</td>
                        <td><span class="status-badge ${ejemplar.Estado === 'Disponible' ? 'status-available' : 'status-borrowed'}">${ejemplar.Estado}</span></td>
                        <td>${ejemplar.Signatura || '-'}</td>
                        <td>
                            ${ejemplar.Estado === 'Disponible' ? 
                                '<button class="btn btn-sm btn-primary btn-reservar-ejemplar" data-id="' + ejemplar.EjemplarID + '">Reservar</button>' : 
                                '-'
                            }
                        </td>
                    `;
                    ejemplaresLista.appendChild(tr);
                });
                
                // Agregar event listeners a los botones de reserva
                document.querySelectorAll('.btn-reservar-ejemplar').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const ejemplarId = this.getAttribute('data-id');
                        alert(`Funcionalidad de reserva en desarrollo para el ejemplar ${ejemplarId}`);
                    });
                });
            }
            
            ejemplaresDisponibles.textContent = disponibles;
            ejemplaresTotal.textContent = total;
            
            // Actualizar estado de disponibilidad
            if (disponibles > 0) {
                libroEstado.textContent = 'Disponible';
                libroEstado.className = 'status-badge status-available';
                btnReservar.disabled = false;
            } else {
                libroEstado.textContent = 'No disponible';
                libroEstado.className = 'status-badge status-borrowed';
                btnReservar.disabled = true;
            }
            
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al cargar los datos del libro');
        }
    }

    // Función para mostrar errores
    function mostrarError(mensaje) {
        const contenedor = document.querySelector('.libro-detalle');
        contenedor.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${mensaje}</p>
                <a href="/catalogo.html" class="btn">Volver al catálogo</a>
            </div>
        `;
    }
});