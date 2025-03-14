// public/js/catalogo.js
document.addEventListener('DOMContentLoaded', function() {
    // Variables
    const librosContainer = document.getElementById('libros-container');
    const paginacionContainer = document.getElementById('paginacion');
    const buscarTitulo = document.getElementById('buscar-titulo');
    const buscarAutor = document.getElementById('buscar-autor');
    const categoriaFiltro = document.getElementById('categoria-filtro');
    const btnBuscar = document.getElementById('btn-buscar');
    
    let paginaActual = 1;
    const tamanioPagina = 10;
    
    // Cargar categorías
    cargarCategorias();
    
    // Cargar libros iniciales
    cargarLibros();
    
    // Event listeners
    btnBuscar.addEventListener('click', function() {
      paginaActual = 1;
      cargarLibros();
    });
    
    // Función para cargar libros
    function cargarLibros() {
      // Mostrar loader
      librosContainer.innerHTML = '<div class="loader">Cargando libros...</div>';
      
      // Construir URL con filtros
      let url = `/api/libros?page=${paginaActual}&size=${tamanioPagina}`;
      
      if (buscarTitulo.value.trim()) {
        url += `&titulo=${encodeURIComponent(buscarTitulo.value.trim())}`;
      }
      
      if (buscarAutor.value.trim()) {
        url += `&autor=${encodeURIComponent(buscarAutor.value.trim())}`;
      }
      
      if (categoriaFiltro.value) {
        url += `&categoria=${encodeURIComponent(categoriaFiltro.value)}`;
      }
      
      // Hacer la petición
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.libros.length === 0) {
            librosContainer.innerHTML = '<div class="no-results">No se encontraron libros con los criterios seleccionados.</div>';
            paginacionContainer.innerHTML = '';
            return;
          }
          
          // Generar HTML para los libros
          let html = '';
          
          data.libros.forEach(libro => {
            // Contar ejemplares disponibles
            const ejemplaresTotal = libro.ejemplares ? libro.ejemplares.length : 0;
            const ejemplaresDisponibles = libro.ejemplares ? 
              libro.ejemplares.filter(ej => ej.Estado === 'Disponible').length : 0;
            
            // Determinar estado general
            let statusClass = 'status-borrowed';
            let statusText = 'No disponible';
            
            if (ejemplaresDisponibles > 0) {
              statusClass = 'status-available';
              statusText = `${ejemplaresDisponibles} disponible${ejemplaresDisponibles > 1 ? 's' : ''}`;
            }
            
            html += `
              <div class="libro-card" data-id="${libro.LibroID}">
                <div class="libro-cover">
                  <img src="${libro.ImagenPortada || '/images/book-placeholder.png'}" alt="${libro.Titulo}">
                </div>
                <div class="libro-info">
                  <div class="libro-title">${libro.Titulo}</div>
                  <div class="libro-author">${libro.autor ? `${libro.autor.Nombre} ${libro.autor.Apellido}` : 'Autor desconocido'}</div>
                  <div class="libro-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                  </div>
                </div>
              </div>
            `;
          });
          
          librosContainer.innerHTML = html;
          
          // Generar paginación
          generarPaginacion(data.currentPage, data.totalPages);
          
          // Agregar listeners a las tarjetas de libros
          document.querySelectorAll('.libro-card').forEach(card => {
            card.addEventListener('click', function() {
              const libroId = this.getAttribute('data-id');
              window.location.href = `/libro.html?id=${libroId}`;
            });
          });
        })
        .catch(error => {
          console.error('Error:', error);
          librosContainer.innerHTML = '<div class="error">Error al cargar los libros. Por favor, inténtalo de nuevo.</div>';
        });
    }
    
    // Función para cargar categorías
    function cargarCategorias() {
      fetch('/api/categorias')
        .then(response => response.json())
        .then(data => {
          let options = '<option value="">Todas las categorías</option>';
          
          data.forEach(categoria => {
            options += `<option value="${categoria.CategoriaID}">${categoria.Nombre}</option>`;
          });
          
          categoriaFiltro.innerHTML = options;
        })
        .catch(error => {
          console.error('Error:', error);
        });
    }
    
    // Función para generar paginación
    function generarPaginacion(paginaActual, totalPaginas) {
      if (totalPaginas <= 1) {
        paginacionContainer.innerHTML = '';
        return;
      }
      
      let html = '';
      
      // Botón anterior
      html += `<div class="page-item ${paginaActual === 1 ? 'disabled' : ''}" data-page="${paginaActual - 1}">«</div>`;
      
      // Páginas
      for (let i = 1; i <= totalPaginas; i++) {
        if (
          i === 1 || // Primera página
          i === totalPaginas || // Última página
          (i >= paginaActual - 1 && i <= paginaActual + 1) // Páginas cercanas a la actual
        ) {
          html += `<div class="page-item ${i === paginaActual ? 'active' : ''}" data-page="${i}">${i}</div>`;
        } else if (
          (i === paginaActual - 2 && paginaActual > 3) ||
          (i === paginaActual + 2 && paginaActual < totalPaginas - 2)
        ) {
          html += `<div class="page-item disabled">...</div>`;
        }
      }
      
      // Botón siguiente
      html += `<div class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}" data-page="${paginaActual + 1}">»</div>`;
      
      paginacionContainer.innerHTML = html;
      
      // Agregar event listeners
      document.querySelectorAll('.page-item:not(.disabled)').forEach(item => {
        item.addEventListener('click', function() {
          paginaActual = parseInt(this.getAttribute('data-page'));
          cargarLibros();
          window.scrollTo(0, 0);
        });
      });
    }
  });