// public/js/admin-usuarios.js
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let usuarioSeleccionado = null;
    
    // Elementos DOM
    const tabs = document.querySelectorAll('.nav-tabs li');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const pendientesLista = document.getElementById('pendientes-lista');
    const pendientesEmpty = document.getElementById('pendientes-empty');
    const usuariosLista = document.getElementById('usuarios-lista');
    const selectAllPendientes = document.getElementById('select-all-pendientes');
    const btnAprobarSeleccionados = document.getElementById('btn-aprobar-seleccionados');
    const btnRechazarSeleccionados = document.getElementById('btn-rechazar-seleccionados');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const buscarUsuario = document.getElementById('buscar-usuario');
    const filtroEstado = document.getElementById('filtro-estado');
    const filtroTipo = document.getElementById('filtro-tipo');
    const usuarioModal = document.getElementById('usuario-modal');
    const usuarioDetalle = document.getElementById('usuario-detalle');
    const btnAprobarUsuario = document.getElementById('btn-aprobar-usuario');
    const btnActivarUsuario = document.getElementById('btn-activar-usuario');
    const btnDesactivarUsuario = document.getElementById('btn-desactivar-usuario');
    const btnSuspenderUsuario = document.getElementById('btn-suspender-usuario');
    
    // Obtener el token de autenticación
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login.html';
      return;
    }
    
    // Cambio de pestañas
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remover clase active de todas las pestañas
        tabs.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        // Añadir clase active a la pestaña seleccionada
        this.classList.add('active');
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        
        // Cargar datos según la pestaña
        if (tabId === 'pendientes') {
          cargarUsuariosPendientes();
        } else if (tabId === 'todos') {
          cargarTodosUsuarios();
        }
      });
    });
    
    // Cargar usuarios pendientes de aprobación
    function cargarUsuariosPendientes() {
      fetch('/api/usuarios/pendientes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al cargar usuarios pendientes');
        }
        return response.json();
      })
      .then(data => {
        if (data.length === 0) {
          pendientesLista.innerHTML = '';
          pendientesEmpty.classList.remove('hidden');
          return;
        }
        
        pendientesEmpty.classList.add('hidden');
        
        let html = '';
        data.forEach(usuario => {
          const tipoUsuario = usuario.tipo_usuario.charAt(0).toUpperCase() + usuario.tipo_usuario.slice(1);
          const fechaRegistro = new Date(usuario.fecha_creacion).toLocaleDateString();
          
          html += `
            <tr>
              <td><input type="checkbox" class="usuario-checkbox" data-id="${usuario.id}"></td>
              <td>${usuario.nombre} ${usuario.apellido}</td>
              <td>${usuario.email}</td>
              <td>${tipoUsuario}</td>
              <td>${fechaRegistro}</td>
              <td>
                <button class="btn-sm btn-info ver-usuario" data-id="${usuario.id}">Ver</button>
                <button class="btn-sm btn-success aprobar-usuario" data-id="${usuario.id}">Aprobar</button>
                <button class="btn-sm btn-danger rechazar-usuario" data-id="${usuario.id}">Rechazar</button>
              </td>
            </tr>
          `;
        });
        
        pendientesLista.innerHTML = html;
        
        // Añadir event listeners a los botones
        document.querySelectorAll('.ver-usuario').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            abrirModalUsuario(id);
          });
        });
        
        document.querySelectorAll('.aprobar-usuario').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            aprobarUsuario(id);
          });
        });
        
        document.querySelectorAll('.rechazar-usuario').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            rechazarUsuario(id);
          });
        });
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error al cargar usuarios pendientes');
      });
    }
    
    // Cargar todos los usuarios con filtros
    function cargarTodosUsuarios(page = 1) {
      const busqueda = buscarUsuario.value.trim();
      const estado = filtroEstado.value;
      const tipo = filtroTipo.value;
      
      let url = `/api/usuarios?page=${page}`;
      if (busqueda) url += `&search=${encodeURIComponent(busqueda)}`;
      if (estado) url += `&estado=${estado}`;
      if (tipo) url += `&tipo=${tipo}`;
      
      fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al cargar usuarios');
        }
        return response.json();
      })
      .then(data => {
        renderizarUsuarios(data.usuarios);
        renderizarPaginacion(data.currentPage, data.totalPages);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error al cargar usuarios');
      });
    }
    
    // Renderizar lista de usuarios
    function renderizarUsuarios(usuarios) {
      if (usuarios.length === 0) {
        usuariosLista.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron usuarios</td></tr>';
        return;
      }
      
      let html = '';
      usuarios.forEach(usuario => {
        const tipoUsuario = usuario.tipo_usuario.charAt(0).toUpperCase() + usuario.tipo_usuario.slice(1);
        const estadoUsuario = usuario.estado.charAt(0).toUpperCase() + usuario.estado.slice(1);
        const fechaRegistro = new Date(usuario.fecha_creacion).toLocaleDateString();
        
        let estadoClass = '';
        switch (usuario.estado) {
          case 'activo': estadoClass = 'text-success'; break;
          case 'inactivo': estadoClass = 'text-warning'; break;
          case 'suspendido': estadoClass = 'text-danger'; break;
          case 'pendiente': estadoClass = 'text-secondary'; break;
        }
        
        html += `
          <tr>
            <td>${usuario.nombre} ${usuario.apellido}</td>
            <td>${usuario.email}</td>
            <td>${tipoUsuario}</td>
            <td><span class="${estadoClass}">${estadoUsuario}</span></td>
            <td>${fechaRegistro}</td>
            <td>
              <button class="btn-sm btn-info ver-usuario" data-id="${usuario.id}">Ver</button>
              ${usuario.estado !== 'activo' ? `<button class="btn-sm btn-success activar-usuario" data-id="${usuario.id}">Activar</button>` : ''}
              ${usuario.estado === 'activo' ? `<button class="btn-sm btn-warning desactivar-usuario" data-id="${usuario.id}">Desactivar</button>` : ''}
              ${usuario.estado !== 'suspendido' ? `<button class="btn-sm btn-danger suspender-usuario" data-id="${usuario.id}">Suspender</button>` : ''}
            </td>
          </tr>
        `;
      });
      
      usuariosLista.innerHTML = html;
      
      // Añadir event listeners
      document.querySelectorAll('.ver-usuario').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          abrirModalUsuario(id);
        });
      });
      
      document.querySelectorAll('.activar-usuario').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          cambiarEstadoUsuario(id, 'activo');
        });
      });
      
      document.querySelectorAll('.desactivar-usuario').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          cambiarEstadoUsuario(id, 'inactivo');
        });
      });
      
      document.querySelectorAll('.suspender-usuario').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          cambiarEstadoUsuario(id, 'suspendido');
        });
      });
    }
    
    // Renderizar paginación
    function renderizarPaginacion(currentPage, totalPages) {
      const paginacion = document.getElementById('usuarios-paginacion');
      
      if (totalPages <= 1) {
        paginacion.innerHTML = '';
        return;
      }
      
      let html = '<ul class="pagination-list">';
      
      // Botón anterior
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <button class="btn-page" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">Anterior</button>
      </li>`;
      
      // Números de página
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);
      
      for (let i = startPage; i <= endPage; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
          <button class="btn-page" data-page="${i}">${i}</button>
        </li>`;
      }
      
      // Botón siguiente
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <button class="btn-page" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Siguiente</button>
      </li>`;
      
      html += '</ul>';
      paginacion.innerHTML = html;
      
      // Añadir event listeners a los botones de paginación
      document.querySelectorAll('.btn-page').forEach(btn => {
        if (!btn.disabled) {
          btn.addEventListener('click', function() {
            const page = parseInt(this.getAttribute('data-page'));
            cargarTodosUsuarios(page);
          });
        }
      });
    }
    
    // Abrir modal de usuario
    function abrirModalUsuario(id) {
      fetch(`/api/usuarios/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al cargar usuario');
        }
        return response.json();
      })
      .then(usuario => {
        usuarioSeleccionado = usuario;
        
        // Mostrar detalles del usuario
        let html = `
          <div class="usuario-info">
            <h4>${usuario.nombre} ${usuario.apellido}</h4>
            <p><strong>Email:</strong> ${usuario.email}</p>
            <p><strong>Tipo:</strong> ${usuario.tipo_usuario.charAt(0).toUpperCase() + usuario.tipo_usuario.slice(1)}</p>
            <p><strong>Estado:</strong> ${usuario.estado.charAt(0).toUpperCase() + usuario.estado.slice(1)}</p>
            <p><strong>Fecha de registro:</strong> ${new Date(usuario.fecha_creacion).toLocaleDateString()}</p>
        `;
        
        // Mostrar detalles adicionales según el tipo de usuario
        if (usuario.perfil) {
          if (usuario.tipo_usuario === 'alumno') {
            const nivelText = {
              'primaria': 'Primaria',
              'secundaria_basica': 'Secundaria Básica',
              'secundaria_tecnica': 'Secundaria Técnica'
            };
            const turnoText = {
              'matutino': 'Matutino',
              'vespertino': 'Vespertino',
              'tiempo_completo': 'Tiempo Completo'
            };
            
            html += `
              <div class="perfil-info">
                <h5>Información Académica</h5>
                <p><strong>Nivel:</strong> ${nivelText[usuario.perfil.nivel_educativo] || '-'}</p>
                <p><strong>Grado:</strong> ${usuario.perfil.grado || '-'}</p>
                <p><strong>Grupo:</strong> ${usuario.perfil.grupo || '-'}</p>
                <p><strong>Turno:</strong> ${turnoText[usuario.perfil.turno] || '-'}</p>
                <p><strong>Matrícula:</strong> ${usuario.perfil.matricula || '-'}</p>
              </div>
            `;
          } else if (usuario.tipo_usuario === 'docente') {
            html += `
              <div class="perfil-info">
                <h5>Información Docente</h5>
                <p><strong>Departamento:</strong> ${usuario.perfil.departamento || '-'}</p>
                <p><strong>Código de empleado:</strong> ${usuario.perfil.codigo_empleado || '-'}</p>
                <p><strong>Asignaturas:</strong> ${usuario.perfil.asignaturas ? JSON.parse(usuario.perfil.asignaturas).join(', ') : '-'}</p>
              </div>
            `;
          }
        }
        
        html += '</div>';
        
        usuarioDetalle.innerHTML = html;
        
        // Mostrar/ocultar botones según el estado
        btnAprobarUsuario.style.display = usuario.estado === 'pendiente' ? 'inline-block' : 'none';
        btnActivarUsuario.style.display = usuario.estado !== 'activo' ? 'inline-block' : 'none';
        btnDesactivarUsuario.style.display = usuario.estado === 'activo' ? 'inline-block' : 'none';
        btnSuspenderUsuario.style.display = usuario.estado !== 'suspendido' ? 'inline-block' : 'none';
        
        // Mostrar modal
        usuarioModal.style.display = 'block';
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error al cargar detalles del usuario');
      });
    }
    
    // Cerrar modal
    document.querySelector('.close').addEventListener('click', function() {
      usuarioModal.style.display = 'none';
      usuarioSeleccionado = null;
    });
    
    // Aprobar usuario
    function aprobarUsuario(id) {
      if (!confirm('¿Estás seguro de que deseas aprobar a este usuario?')) return;
      
      fetch(`/api/usuarios/${id}/aprobar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al aprobar usuario');
        }
        return response.json();
      })
      .then(data => {
        alert(data.message || 'Usuario aprobado correctamente');
        cargarUsuariosPendientes();
        if (usuarioModal.style.display === 'block') {
          usuarioModal.style.display = 'none';
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error al aprobar usuario');
      });
    }
    
    // Rechazar usuario (desactivar)
    function rechazarUsuario(id) {
      if (!confirm('¿Estás seguro de que deseas rechazar a este usuario?')) return;
      
      cambiarEstadoUsuario(id, 'inactivo');
    }
    
    // Cambiar estado de usuario
    function cambiarEstadoUsuario(id, estado) {
      const estadoTexto = {
        'activo': 'activar',
        'inactivo': 'desactivar',
        'suspendido': 'suspender'
      };
      
      if (!confirm(`¿Estás seguro de que deseas ${estadoTexto[estado]} a este usuario?`)) return;
      
      fetch(`/api/usuarios/${id}/estado`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error al ${estadoTexto[estado]} usuario`);
        }
        return response.json();
      })
      .then(data => {
        alert(data.message || `Usuario ${estadoTexto[estado]}do correctamente`);
        if (document.querySelector('.tab-pane.active').id === 'pendientes') {
          cargarUsuariosPendientes();
        } else {
          cargarTodosUsuarios();
        }
        
        if (usuarioModal.style.display === 'block') {
          usuarioModal.style.display = 'none';
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert(`Error al ${estadoTexto[estado]} usuario`);
      });
    }
    
    // Event listeners para botones de acción
    btnAprobarUsuario.addEventListener('click', function() {
      if (usuarioSeleccionado) {
        aprobarUsuario(usuarioSeleccionado.id);
      }
    });
    
    btnActivarUsuario.addEventListener('click', function() {
      if (usuarioSeleccionado) {
        cambiarEstadoUsuario(usuarioSeleccionado.id, 'activo');
      }
    });
    
    btnDesactivarUsuario.addEventListener('click', function() {
      if (usuarioSeleccionado) {
        cambiarEstadoUsuario(usuarioSeleccionado.id, 'inactivo');
      }
    });
    
    btnSuspenderUsuario.addEventListener('click', function() {
      if (usuarioSeleccionado) {
        cambiarEstadoUsuario(usuarioSeleccionado.id, 'suspendido');
      }
    });
    
    // Seleccionar/deseleccionar todos los usuarios pendientes
    selectAllPendientes.addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.usuario-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
      });
    });
    
    // Aprobar usuarios seleccionados
    btnAprobarSeleccionados.addEventListener('click', function() {
      const seleccionados = document.querySelectorAll('.usuario-checkbox:checked');
      
      if (seleccionados.length === 0) {
        alert('Selecciona al menos un usuario para aprobar');
        return;
      }
      
      if (!confirm(`¿Estás seguro de que deseas aprobar ${seleccionados.length} usuarios?`)) return;
      
      // Procesar aprobaciones en secuencia
      const ids = Array.from(seleccionados).map(checkbox => checkbox.getAttribute('data-id'));
      
      Promise.all(ids.map(id => 
        fetch(`/api/usuarios/${id}/aprobar`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ))
      .then(() => {
        alert(`${ids.length} usuarios aprobados correctamente`);
        cargarUsuariosPendientes();
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error al aprobar usuarios seleccionados');
      });
    });
    
    // Rechazar usuarios seleccionados
    btnRechazarSeleccionados.addEventListener('click', function() {
      const seleccionados = document.querySelectorAll('.usuario-checkbox:checked');
      
      if (seleccionados.length === 0) {
        alert('Selecciona al menos un usuario para rechazar');
        return;
      }
      
      if (!confirm(`¿Estás seguro de que deseas rechazar ${seleccionados.length} usuarios?`)) return;
      
      // Procesar rechazos en secuencia
      const ids = Array.from(seleccionados).map(checkbox => checkbox.getAttribute('data-id'));
      
      Promise.all(ids.map(id => 
        fetch(`/api/usuarios/${id}/estado`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ estado: 'inactivo' })
        })
      ))
      .then(() => {
        alert(`${ids.length} usuarios rechazados correctamente`);
        cargarUsuariosPendientes();
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error al rechazar usuarios seleccionados');
      });
    });
    
    // Filtrar usuarios
    btnFiltrar.addEventListener('click', function() {
      cargarTodosUsuarios(1);
    });
    
    // Evento cuando se presiona Enter en el campo de búsqueda
    buscarUsuario.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        cargarTodosUsuarios(1);
      }
    });
    
    // Filtrar al cambiar los select
    filtroEstado.addEventListener('change', function() {
      cargarTodosUsuarios(1);
    });
    
    filtroTipo.addEventListener('change', function() {
      cargarTodosUsuarios(1);
    });
    
    // Cargar datos iniciales
    cargarUsuariosPendientes();
  });