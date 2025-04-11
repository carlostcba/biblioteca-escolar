document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login.html';
      return;
    }
  
    const container = document.getElementById('inventario-container');
    const filtroTitulo = document.getElementById('buscar-libro');
    const filtroCodigo = document.getElementById('buscar-codigo');
    const filtroEstado = document.getElementById('estado-filtro');
    const btnFiltrar = document.getElementById('btn-filtrar');
  
    const btnAgregarLibro = document.getElementById('btn-agregar-libro');
    const btnAgregarEjemplar = document.getElementById('btn-agregar-ejemplar');
  
    const modalLibro = document.getElementById('modal-libro');
    const modalEjemplar = document.getElementById('modal-ejemplar');
  
    const cerrarModalLibro = document.getElementById('cerrar-modal-libro');
    const cancelarModalLibro = document.getElementById('cancelar-modal-libro');
    const cerrarModalEjemplar = document.getElementById('cerrar-modal-ejemplar');
    const cancelarModalEjemplar = document.getElementById('cancelar-modal-ejemplar');
  
    const formLibro = document.getElementById('form-libro');
    const formEjemplar = document.getElementById('form-ejemplar');
  
    // Mostrar modales
    btnAgregarLibro.addEventListener('click', () => {
      modalLibro.classList.remove('hidden');
    });
  
    btnAgregarEjemplar.addEventListener('click', () => {
      modalEjemplar.classList.remove('hidden');
    });
  
    // Cerrar modales
    cerrarModalLibro.addEventListener('click', () => modalLibro.classList.add('hidden'));
    cancelarModalLibro.addEventListener('click', () => modalLibro.classList.add('hidden'));
    cerrarModalEjemplar.addEventListener('click', () => modalEjemplar.classList.add('hidden'));
    cancelarModalEjemplar.addEventListener('click', () => modalEjemplar.classList.add('hidden'));
  
    // Enviar formulario de libro
    formLibro.addEventListener('submit', async function (e) {
      e.preventDefault();
      const datos = Object.fromEntries(new FormData(formLibro));
      try {
        const res = await fetch('/api/libros', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(datos)
        });
        if (!res.ok) throw new Error('Error al guardar libro');
        modalLibro.classList.add('hidden');
        formLibro.reset();
        alert('Libro guardado correctamente');
        cargarInventario();
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    });
  
    // Enviar formulario de ejemplar (crear o editar)
    formEjemplar.addEventListener('submit', async function (e) {
      e.preventDefault();
      const datos = Object.fromEntries(new FormData(formEjemplar));
      const isEdit = formEjemplar.dataset.id;
  
      const url = isEdit
        ? `/api/ejemplares/${formEjemplar.dataset.id}`
        : '/api/ejemplares';
  
      const method = isEdit ? 'PUT' : 'POST';
  
      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(datos)
        });
        if (!res.ok) throw new Error('Error al guardar ejemplar');
        modalEjemplar.classList.add('hidden');
        formEjemplar.reset();
        delete formEjemplar.dataset.id;
        alert('Ejemplar guardado correctamente');
        cargarInventario();
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    });
  
    // Cargar ejemplares
    async function cargarInventario() {
      container.innerHTML = '<div class="loader">Cargando ejemplares...</div>';
      let query = [];
      if (filtroTitulo.value) query.push(`titulo=${encodeURIComponent(filtroTitulo.value)}`);
      if (filtroCodigo.value) query.push(`codigo=${encodeURIComponent(filtroCodigo.value)}`);
      if (filtroEstado.value) query.push(`estado=${encodeURIComponent(filtroEstado.value)}`);
  
      try {
        const res = await fetch(`/api/ejemplares?${query.join('&')}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('No se pudieron obtener los ejemplares');
  
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          container.innerHTML = '<p>No se encontraron ejemplares.</p>';
          return;
        }
  
        container.innerHTML = '';
        data.forEach(ejemplar => {
          const libro = ejemplar.libro || {};
          const div = document.createElement('div');
          div.className = 'inventario-item';
          div.innerHTML = `
            <div class="info">
              <strong>${libro.Titulo || 'Título desconocido'}</strong><br>
              Código: ${ejemplar.CodigoBarras}<br>
              Estado: ${ejemplar.Estado}, Condición: ${ejemplar.Condicion}
            </div>
            <div class="acciones">
              <button class="btn btn-sm btn-primary btn-editar-ejemplar" data-id="${ejemplar.EjemplarID}">Editar</button>
            </div>
          `;
          container.appendChild(div);
        });
      } catch (err) {
        container.innerHTML = `<p class="error">${err.message}</p>`;
      }
    }
  
    // Delegar evento para botón de edición
    container.addEventListener('click', async (e) => {
      if (e.target.classList.contains('btn-editar-ejemplar')) {
        const ejemplarId = e.target.dataset.id;
        try {
          const res = await fetch(`/api/ejemplares/${ejemplarId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (!res.ok) throw new Error('No se pudo obtener el ejemplar');
  
          const ejemplar = await res.json();
  
          // Cargar datos en el formulario
          formEjemplar.dataset.id = ejemplar.EjemplarID;
          formEjemplar.CodigoBarras.value = ejemplar.CodigoBarras || '';
          formEjemplar.Signatura.value = ejemplar.Signatura || '';
          formEjemplar.Condicion.value = ejemplar.Condicion || 'Bueno';
          formEjemplar.LibroID.value = ejemplar.LibroID;
  
          modalEjemplar.classList.remove('hidden');
        } catch (err) {
          alert(err.message);
        }
      }
    });
  
    btnFiltrar.addEventListener('click', cargarInventario);
    cargarInventario();
  });
  