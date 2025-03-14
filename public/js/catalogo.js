// public/js/catalogo.js
document.addEventListener('DOMContentLoaded', function() {
  // Variables
  const librosContainer = document.getElementById('libros-container');
  const paginacionContainer = document.getElementById('paginacion');
  const buscarTitulo = document.getElementById('buscar-titulo');
  const buscarAutor = document.getElementById('buscar-autor');
  const categoriaFiltro = document.getElementById('categoria-filtro');
  const btnBuscar = document.getElementById('btn-buscar');
  
  // Variables para filtrado alfabético
  let filtroLetraTitulo = '';
  let filtroLetraAutor = '';
  
  let paginaActual = 1;
  const tamanioPagina = 10;
  
  // Cargar categorías
  cargarCategorias();
  
  // Crear filtros alfabéticos
  crearFiltrosAlfabeticos();
  
  // Cargar libros iniciales
  cargarLibros();
  
  // Event listeners
  btnBuscar.addEventListener('click', function() {
    paginaActual = 1;
    cargarLibros();
  });
  
  // Función para crear filtros alfabéticos
  function crearFiltrosAlfabeticos() {
    // Crear filtro alfabético para Autor
    const filtroAutorContainer = document.createElement('div');
    filtroAutorContainer.className = 'filtro-alfabetico';
    
    // Crear etiqueta "Autor" en línea con los botones
    const autorLabel = document.createElement('div');
    autorLabel.className = 'filtro-label';
    autorLabel.textContent = 'Autor';
    filtroAutorContainer.appendChild(autorLabel);
    
    const alfabetoAutor = document.createElement('div');
    alfabetoAutor.className = 'alfabeto-filtro';
    
    // Crear botón "Todos" para autor
    const todosAutor = document.createElement('a');
    todosAutor.href = '#';
    todosAutor.className = 'letra-filtro active';
    todosAutor.textContent = 'Todos';
    todosAutor.addEventListener('click', function(e) {
      e.preventDefault();
      filtroLetraAutor = '';
      activarFiltro(this, alfabetoAutor);
      paginaActual = 1;
      cargarLibros();
    });
    alfabetoAutor.appendChild(todosAutor);
    
    // Crear botón "0-9" para autor
    const numerosAutor = document.createElement('a');
    numerosAutor.href = '#';
    numerosAutor.className = 'letra-filtro';
    numerosAutor.textContent = '0-9';
    numerosAutor.addEventListener('click', function(e) {
      e.preventDefault();
      filtroLetraAutor = '0-9';
      activarFiltro(this, alfabetoAutor);
      paginaActual = 1;
      cargarLibros();
    });
    alfabetoAutor.appendChild(numerosAutor);
    
    // Crear botones de A-Z para autor
    for (let i = 65; i <= 90; i++) {
      const letra = String.fromCharCode(i);
      const letraBtn = document.createElement('a');
      letraBtn.href = '#';
      letraBtn.className = 'letra-filtro';
      letraBtn.textContent = letra;
      letraBtn.addEventListener('click', function(e) {
        e.preventDefault();
        filtroLetraAutor = letra;
        activarFiltro(this, alfabetoAutor);
        paginaActual = 1;
        cargarLibros();
      });
      alfabetoAutor.appendChild(letraBtn);
    }
    
    // Agregar alfabeto al contenedor
    filtroAutorContainer.appendChild(alfabetoAutor);
    
    // Crear filtro alfabético para Título
    const filtroTituloContainer = document.createElement('div');
    filtroTituloContainer.className = 'filtro-alfabetico';
    
    // Crear etiqueta "Título" en línea con los botones
    const tituloLabel = document.createElement('div');
    tituloLabel.className = 'filtro-label';
    tituloLabel.textContent = 'Título';
    filtroTituloContainer.appendChild(tituloLabel);
    
    const alfabetoTitulo = document.createElement('div');
    alfabetoTitulo.className = 'alfabeto-filtro';
    
    // Crear botón "Todos" para título
    const todosTitulo = document.createElement('a');
    todosTitulo.href = '#';
    todosTitulo.className = 'letra-filtro active';
    todosTitulo.textContent = 'Todos';
    todosTitulo.addEventListener('click', function(e) {
      e.preventDefault();
      filtroLetraTitulo = '';
      activarFiltro(this, alfabetoTitulo);
      paginaActual = 1;
      cargarLibros();
    });
    alfabetoTitulo.appendChild(todosTitulo);
    
    // Crear botón "0-9" para título
    const numerosTitulo = document.createElement('a');
    numerosTitulo.href = '#';
    numerosTitulo.className = 'letra-filtro';
    numerosTitulo.textContent = '0-9';
    numerosTitulo.addEventListener('click', function(e) {
      e.preventDefault();
      filtroLetraTitulo = '0-9';
      activarFiltro(this, alfabetoTitulo);
      paginaActual = 1;
      cargarLibros();
    });
    alfabetoTitulo.appendChild(numerosTitulo);
    
    // Crear botones de A-Z para título
    for (let i = 65; i <= 90; i++) {
      const letra = String.fromCharCode(i);
      const letraBtn = document.createElement('a');
      letraBtn.href = '#';
      letraBtn.className = 'letra-filtro';
      letraBtn.textContent = letra;
      letraBtn.addEventListener('click', function(e) {
        e.preventDefault();
        filtroLetraTitulo = letra;
        activarFiltro(this, alfabetoTitulo);
        paginaActual = 1;
        cargarLibros();
      });
      alfabetoTitulo.appendChild(letraBtn);
    }
    
    // Agregar alfabeto al contenedor
    filtroTituloContainer.appendChild(alfabetoTitulo);
    
    // Insertar filtros en el DOM
    const filterBar = document.querySelector('.filter-bar');
    filterBar.parentNode.insertBefore(filtroAutorContainer, filterBar.nextSibling);
    filterBar.parentNode.insertBefore(filtroTituloContainer, filtroAutorContainer.nextSibling);
  }
  
  // Función para activar filtro seleccionado
  function activarFiltro(elemento, contenedor) {
    // Quitar clase active de todos los filtros
    const filtros = contenedor.querySelectorAll('.letra-filtro');
    filtros.forEach(f => f.classList.remove('active'));
    
    // Agregar clase active al elemento seleccionado
    elemento.classList.add('active');
  }
  
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
    
    // Agregar filtros alfabéticos
    if (filtroLetraTitulo) {
      if (filtroLetraTitulo === '0-9') {
        url += `&tituloInicia=0-9`;
      } else {
        url += `&tituloInicia=${filtroLetraTitulo}`;
      }
    }
    
    if (filtroLetraAutor) {
      if (filtroLetraAutor === '0-9') {
        url += `&autorInicia=0-9`;
      } else {
        url += `&autorInicia=${filtroLetraAutor}`;
      }
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
  function generarPaginacion(currentPage, totalPaginas) {
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