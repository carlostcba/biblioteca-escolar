// public/js/mis-reservas.js
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticación
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  const userInfo = localStorage.getItem('user_info') ? JSON.parse(localStorage.getItem('user_info')) : null;
  
  if (!token || !userInfo) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
    return;
  }
  
  // Referencias a elementos del DOM
  const tabs = document.querySelectorAll('.tab');
  const reservasContainer = document.getElementById('reservas-container');
  const prestamosContainer = document.getElementById('prestamos-container');
  const emptyState = document.getElementById('empty-state');
  const modalCancelar = document.getElementById('modal-cancelar');
  const modalRenovar = document.getElementById('modal-renovar');
  const btnSiCancelar = document.getElementById('btn-si-cancelar');
  const btnNoCancelar = document.getElementById('btn-no-cancelar');
  const btnConfirmarRenovacion = document.getElementById('btn-confirmar-renovacion');
  const btnCancelarRenovacion = document.getElementById('btn-cancelar-renovacion');
  const modalTituloCancelar = document.getElementById('modal-titulo-cancelar');
  const modalTituloRenovar = document.getElementById('modal-titulo-renovar');
  const cerrarModales = document.querySelectorAll('.modal-close');
  
  // Estado de la aplicación
  let tabActiva = 'activas';
  let reservaSeleccionada = null;
  let prestamoSeleccionado = null;
  
  // Event Listeners para pestañas
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      cambiarTab(this.getAttribute('data-tab'));
    });
  });
  
  // Event Listeners para modales
  if (btnNoCancelar) {
    btnNoCancelar.addEventListener('click', () => cerrarModal(modalCancelar));
  }
  
  if (btnCancelarRenovacion) {
    btnCancelarRenovacion.addEventListener('click', () => cerrarModal(modalRenovar));
  }
  
  // Cerrar modales al hacer clic en X
  cerrarModales.forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      cerrarModal(modal);
    });
  });
  
  // Cerrar modales al hacer clic fuera
  window.addEventListener('click', function(event) {
    if (event.target === modalCancelar) {
      cerrarModal(modalCancelar);
    } else if (event.target === modalRenovar) {
      cerrarModal(modalRenovar);
    }
  });
  
  // Cargar datos iniciales
  cargarMisReservas();
  cargarMisPrestamos();
  
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
    
    // Mostrar u ocultar sección de préstamos activos según la pestaña seleccionada
    const seccionPrestamos = document.querySelector('.section-title');
    const prestamosContainer = document.getElementById('prestamos-container');
    
    if (tabId === 'historial') {
      // Ocultar sección de préstamos activos en la pestaña de historial
      if (seccionPrestamos) seccionPrestamos.classList.add('hidden');
      if (prestamosContainer) prestamosContainer.classList.add('hidden');
    } else {
      // Mostrar sección de préstamos activos en la pestaña de activas
      if (seccionPrestamos) seccionPrestamos.classList.remove('hidden');
      if (prestamosContainer) prestamosContainer.classList.remove('hidden');
    }
    
    // Cargar reservas según la tab seleccionada
    cargarMisReservas();
  }
  
  /**
   * Carga las reservas del usuario actual
   */
  async function cargarMisReservas() {
    try {
      // Mostrar loader
      reservasContainer.innerHTML = '<div class="loader">Cargando reservas...</div>';
      
      // Realizar petición al servidor
      const response = await fetch(`/api/reservas/mis-reservas?tab=${tabActiva}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar reservas');
      }
      
      const reservas = await response.json();
      
      // Vaciar contenedor
      reservasContainer.innerHTML = '';
      
      // Si no hay reservas, mostrar mensaje
      if (!reservas || reservas.length === 0) {
        reservasContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }
      
      // Ocultar mensaje de vacío
      emptyState.classList.add('hidden');
      
      // Renderizar reservas
      reservas.forEach(reserva => {
        const reservaElement = document.createElement('div');
        reservaElement.classList.add('reserva-item');
        reservaElement.setAttribute('data-id', reserva.ReservaID);
        
        // Formatear fechas
        const fechaReserva = new Date(reserva.FechaReserva).toLocaleDateString('es-ES');
        const fechaExpiracion = new Date(reserva.FechaExpiracion).toLocaleDateString('es-ES');
        
        // Determinar clase de estado
        let estadoClass = '';
        let estadoTexto = reserva.Estado;
        
        switch (reserva.Estado.toLowerCase()) {
          case 'pendiente':
            estadoClass = 'estado-pendiente';
            estadoTexto = 'Pendiente';
            break;
          case 'lista':
            estadoClass = 'estado-lista';
            estadoTexto = 'Lista para recoger';
            break;
          case 'completada':
            estadoClass = 'estado-completada';
            estadoTexto = 'Completada';
            break;
          case 'cancelada':
            estadoClass = 'estado-cancelada';
            estadoTexto = 'Cancelada';
            break;
          case 'vencida':
            estadoClass = 'estado-vencida';
            estadoTexto = 'Vencida';
            break;
        }
        
        // Preparar acciones según estado
        let accionesHtml = '';
        if (reserva.Estado.toLowerCase() === 'pendiente') {
          accionesHtml = `
            <div class="reserva-acciones">
              <button class="btn btn-danger btn-cancelar-reserva" data-id="${reserva.ReservaID}">
                <i class="fas fa-times"></i> Cancelar Reserva
              </button>
            </div>
          `;
        } else if (reserva.Estado.toLowerCase() === 'lista') {
          accionesHtml = `
            <div class="reserva-acciones">
              <button class="btn btn-danger btn-cancelar-reserva" data-id="${reserva.ReservaID}">
                <i class="fas fa-times"></i> Cancelar Reserva
              </button>
            </div>
          `;
        }
        
        // Nueva estructura para formato de lista
        reservaElement.innerHTML = `
          <div class="reserva-info-principal">
            <h3 class="reserva-titulo">${reserva.libro.Titulo}</h3>
            <p class="reserva-isbn">ISBN: ${reserva.libro.ISBN || 'No disponible'}</p>
            <div class="detalle-grupo">
              <span class="detalle-etiqueta">Autor</span>
              <span class="detalle-valor">${reserva.libro.autor ? `${reserva.libro.autor.Nombre} ${reserva.libro.autor.Apellido}` : 'Desconocido'}</span>
            </div>
          </div>
          
          <div class="reserva-info-secundaria">
            <div class="reserva-detalles">
              <div class="detalle-grupo">
                <span class="detalle-etiqueta">Fecha de Reserva</span>
                <span class="detalle-valor">${fechaReserva}</span>
              </div>
              <div class="detalle-grupo">
                <span class="detalle-etiqueta">Disponible Hasta</span>
                <span class="detalle-valor">${fechaExpiracion}</span>
              </div>
            </div>
            
            <div class="reserva-estado-container">
              <span class="reserva-estado ${estadoClass}">${estadoTexto}</span>
            </div>
            
            ${accionesHtml ? `<div class="reserva-acciones-container">${accionesHtml}</div>` : ''}
          </div>
        `;
        
        reservasContainer.appendChild(reservaElement);
      });
      
      // Agregar event listeners para botones de cancelar
      document.querySelectorAll('.btn-cancelar-reserva').forEach(btn => {
        btn.addEventListener('click', function() {
          const reservaId = this.getAttribute('data-id');
          abrirModalCancelar(reservaId);
        });
      });
      
    } catch (error) {
      console.error('Error:', error);
      reservasContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error al cargar tus reservas. Por favor, intenta nuevamente.</p>
        </div>
      `;
    }
  }
  
  /**
   * Carga los préstamos activos del usuario
   */
  async function cargarMisPrestamos() {
    try {
      prestamosContainer.innerHTML = '<div class="loader">Cargando préstamos...</div>';
      
      const response = await fetch('/api/prestamos/mis-prestamos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar préstamos');
      }
      
      const prestamos = await response.json();
      console.log('Préstamos recibidos:', prestamos);
      
      prestamosContainer.innerHTML = '';
      
      if (!prestamos || prestamos.length === 0) {
        prestamosContainer.innerHTML = `
          <div class="empty-state small">
            <div class="empty-icon">📚</div>
            <h3>No tienes préstamos activos</h3>
            <p>Cuando solicites un préstamo, aparecerá en esta sección.</p>
          </div>
        `;
        return;
      }
      
      // Crear contenedor para los préstamos como lista
      const prestamosLista = document.createElement('div');
      prestamosLista.className = 'prestamos-lista';
      prestamosContainer.appendChild(prestamosLista);
      
      prestamos.forEach(prestamo => {
        const fechaPrestamo = new Date(prestamo.FechaPrestamo).toLocaleDateString('es-ES');
        const fechaDevolucion = new Date(prestamo.FechaDevolucion).toLocaleDateString('es-ES');
        
        // Calcular días restantes
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaVencimiento = new Date(prestamo.FechaDevolucion);
        fechaVencimiento.setHours(0, 0, 0, 0);
        
        const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
        
        let vencimientoClass = 'plazo-normal';
        let vencimientoTexto = `Vence en ${diasRestantes} días`;
        
        if (diasRestantes < 0) {
          vencimientoClass = 'vencido';
          vencimientoTexto = `Vencido hace ${Math.abs(diasRestantes)} días`;
        } else if (diasRestantes <= 3) {
          vencimientoClass = 'vence-pronto';
          vencimientoTexto = diasRestantes === 1 ? 'Vence mañana' : `Vence en ${diasRestantes} días`;
        }
        
        // Verificar si puede renovar
        const puedeRenovar = prestamo.Estado.toLowerCase() === 'activo' && prestamo.Renovaciones < 2;
        
        const prestamoCard = document.createElement('div');
        prestamoCard.className = 'prestamo-card';
        prestamoCard.setAttribute('data-id', prestamo.PrestamoID);
        
        // Nueva estructura para formato de lista
        prestamoCard.innerHTML = `
          <div class="prestamo-info-principal">
            <h3 class="prestamo-titulo">${prestamo.ejemplar?.libro?.Titulo || 'Título no disponible'}</h3>
            <p class="prestamo-codigo">${prestamo.ejemplar ? prestamo.ejemplar.CodigoBarras : 'No disponible'}</p>
            <div class="info-row">
              <span class="info-label">Autor:</span>
              <span class="info-value">${prestamo.ejemplar?.libro?.autor ? `${prestamo.ejemplar.libro.autor.Nombre} ${prestamo.ejemplar.libro.autor.Apellido}` : 'Desconocido'}</span>
            </div>
          </div>
          
          <div class="prestamo-info-secundaria">
            <div class="prestamo-info-fechas">
              <div class="info-row">
                <span class="info-label">Prestado el:</span>
                <span class="info-value">${fechaPrestamo}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vencimiento:</span>
                <span class="info-value">${fechaDevolucion}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Renovaciones:</span>
                <span class="info-value">${prestamo.Renovaciones || 0} de 2</span>
              </div>
            </div>
            
            <div class="prestamo-estado">
              <div class="fecha-vencimiento ${vencimientoClass}">
                ${vencimientoTexto}
              </div>
            </div>
            
            <div class="prestamo-acciones">
              ${puedeRenovar ? `
                <button class="btn btn-primary btn-renovar-prestamo" data-id="${prestamo.PrestamoID}">
                  <i class="fas fa-redo-alt"></i> Renovar
                </button>
              ` : ''}
            </div>
          </div>
        `;
        
        prestamosLista.appendChild(prestamoCard);
      });
      
      // Agregar event listeners para botones de renovar
      document.querySelectorAll('.btn-renovar-prestamo').forEach(btn => {
        btn.addEventListener('click', function() {
          const prestamoId = this.getAttribute('data-id');
          abrirModalRenovar(prestamoId);
        });
      });
      
    } catch (error) {
      console.error('Error detallado:', error);
      prestamosContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error al cargar tus préstamos: ${error.message}</p>
          <button onclick="cargarMisPrestamos()" class="btn btn-small">Reintentar</button>
        </div>
      `;
    }
  }
  
  /**
   * Abre el modal para confirmar cancelación de reserva
   * @param {string} reservaId - ID de la reserva a cancelar
   */
  async function abrirModalCancelar(reservaId) {
    try {
      // Obtener detalles de la reserva
      const response = await fetch(`/api/reservas/${reservaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener detalles de la reserva');
      }
      
      const reserva = await response.json();
      reservaSeleccionada = reserva;
      
      // Mostrar título del libro en el modal
      modalTituloCancelar.textContent = reserva.libro.Titulo;
      
      // Abrir modal
      modalCancelar.classList.add('active');
      
      // Configurar event listeners
      btnSiCancelar.removeEventListener('click', cancelarReserva);
      btnSiCancelar.addEventListener('click', cancelarReserva);
      
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('Error al obtener detalles de la reserva', 'error');
    }
  }
  
  /**
   * Cancela la reserva seleccionada
   */
  async function cancelarReserva() {
    try {
      if (!reservaSeleccionada) {
        throw new Error('No hay una reserva seleccionada');
      }
      
      // Deshabilitar botón y mostrar cargando
      btnSiCancelar.disabled = true;
      btnSiCancelar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
      
      // Enviar solicitud al servidor
      const response = await fetch(`/api/reservas/${reservaSeleccionada.ReservaID}/cancelar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Restaurar botón
      btnSiCancelar.disabled = false;
      btnSiCancelar.innerHTML = 'Sí, cancelar reserva';
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cancelar la reserva');
      }
      
      // Cerrar modal
      cerrarModal(modalCancelar);
      
      // Mostrar mensaje de éxito
      mostrarNotificacion('Reserva cancelada con éxito');
      
      // Actualizar la lista de reservas
      cargarMisReservas();
      
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion(error.message, 'error');
    }
  }
  
  /**
   * Abre el modal para renovar un préstamo
   * @param {string} prestamoId - ID del préstamo a renovar
   */
  async function abrirModalRenovar(prestamoId) {
    try {
      // Obtener detalles del préstamo
      const response = await fetch(`/api/prestamos/${prestamoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener detalles del préstamo');
      }
      
      const prestamo = await response.json();
      prestamoSeleccionado = prestamo;
      
      // Mostrar título del libro en el modal
      modalTituloRenovar.textContent = prestamo.ejemplar?.libro?.Titulo || 'Libro seleccionado';
      
      // Abrir modal
      modalRenovar.classList.add('active');
      
      // Configurar event listeners
      btnConfirmarRenovacion.removeEventListener('click', renovarPrestamo);
      btnConfirmarRenovacion.addEventListener('click', renovarPrestamo);
      
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('Error al obtener detalles del préstamo', 'error');
    }
  }
  
  /**
   * Renueva el préstamo seleccionado
   */
  async function renovarPrestamo() {
    try {
      if (!prestamoSeleccionado) {
        throw new Error('No hay un préstamo seleccionado');
      }
      
      // Deshabilitar botón y mostrar cargando
      btnConfirmarRenovacion.disabled = true;
      btnConfirmarRenovacion.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
      
      // Enviar solicitud al servidor
      const response = await fetch(`/api/prestamos/${prestamoSeleccionado.PrestamoID}/renovar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Restaurar botón
      btnConfirmarRenovacion.disabled = false;
      btnConfirmarRenovacion.innerHTML = 'Confirmar Renovación';
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al renovar el préstamo');
      }
      
      // Cerrar modal
      cerrarModal(modalRenovar);
      
      // Mostrar mensaje de éxito
      mostrarNotificacion('Préstamo renovado con éxito');
      
      // Actualizar la lista de préstamos
      cargarMisPrestamos();
      
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion(error.message, 'error');
    }
  }
  
  /**
   * Cierra un modal y resetea la selección actual
   * @param {HTMLElement} modal - El modal a cerrar
   */
  function cerrarModal(modal) {
    modal.classList.remove('active');
    
    if (modal === modalCancelar) {
      reservaSeleccionada = null;
    } else if (modal === modalRenovar) {
      prestamoSeleccionado = null;
    }
  }
  
  /**
   * Muestra una notificación en pantalla
   * @param {string} mensaje - Mensaje a mostrar
   * @param {string} tipo - Tipo de notificación ('success', 'error', 'warning')
   */
  function mostrarNotificacion(mensaje, tipo = 'success') {
    // Crear notificación si no existe
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
    
    // Configurar cierre
    notificacionItem.querySelector('.notification-close').addEventListener('click', () => {
      notificacionItem.remove();
    });
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      if (notificacionItem.parentNode) {
        notificacionItem.remove();
      }
    }, 5000);
  }
  
  /**
   * Actualiza la información de un libro específico
   * @param {string} libroId - ID del libro a actualizar
   */
  async function obtenerDetallesLibro(libroId) {
    try {
      const response = await fetch(`/api/libros/${libroId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener detalles del libro');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('Error al obtener información del libro', 'error');
      return null;
    }
  }
  
  /**
   * Formatea una fecha para mostrarla en la interfaz
   * @param {string|Date} fecha - Fecha a formatear
   * @param {boolean} incluirHora - Si se debe incluir la hora en el formato
   * @returns {string} - Fecha formateada
   */
  function formatearFecha(fecha, incluirHora = false) {
    if (!fecha) return 'No disponible';
    
    try {
      const fechaObj = new Date(fecha);
      const opciones = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(incluirHora ? { hour: '2-digit', minute: '2-digit' } : {})
      };
      return fechaObj.toLocaleDateString('es-ES', opciones);
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return fecha.toString();
    }
  }
  
  /**
   * Verifica si un préstamo está vencido
   * @param {Object} prestamo - Objeto con información del préstamo
   * @returns {boolean} - True si está vencido, false en caso contrario
   */
  function prestamoVencido(prestamo) {
    if (!prestamo || !prestamo.FechaDevolucion) return false;
    
    const fechaVencimiento = new Date(prestamo.FechaDevolucion);
    const hoy = new Date();
    
    // Establecer ambas fechas a la medianoche para comparar solo días
    fechaVencimiento.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);
    
    return fechaVencimiento < hoy;
  }
  
  /**
   * Calcula el tiempo restante para la expiración de una reserva
   * @param {Object} reserva - Objeto con información de la reserva
   * @returns {Object} - Objeto con la información sobre el tiempo restante
   */
  function calcularTiempoRestante(reserva) {
    if (!reserva || !reserva.FechaExpiracion) {
      return { dias: 0, estado: 'vencida', mensaje: 'Sin información' };
    }
    
    const fechaExpiracion = new Date(reserva.FechaExpiracion);
    const hoy = new Date();
    
    // Establecer ambas fechas a la medianoche para comparar solo días
    fechaExpiracion.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);
    
    // Calcular diferencia en días
    const diferenciaTiempo = fechaExpiracion.getTime() - hoy.getTime();
    const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
    
    let estado, mensaje;
    
    if (diferenciaDias < 0) {
      estado = 'vencida';
      mensaje = `Expiró hace ${Math.abs(diferenciaDias)} días`;
    } else if (diferenciaDias === 0) {
      estado = 'expira-hoy';
      mensaje = 'Expira hoy';
    } else if (diferenciaDias === 1) {
      estado = 'expira-pronto';
      mensaje = 'Expira mañana';
    } else if (diferenciaDias <= 3) {
      estado = 'expira-pronto';
      mensaje = `Expira en ${diferenciaDias} días`;
    } else {
      estado = 'vigente';
      mensaje = `Disponible por ${diferenciaDias} días más`;
    }
    
    return { dias: diferenciaDias, estado, mensaje };
  }
  
  /**
   * Actualiza la UI según el perfil del usuario
   */
  function configurarUISegunPerfil() {
    const tipoUsuario = userInfo.tipo_usuario?.toLowerCase();
    
    // Ajustar UI para cada tipo de usuario
    if (tipoUsuario === 'alumno') {
      // Configuraciones específicas para alumnos
      const limiteRenovaciones = 1; // Los alumnos solo pueden renovar una vez
      
      // Actualizar los textos informativos
      document.querySelectorAll('.info-renovaciones').forEach(el => {
        el.textContent = `${limiteRenovaciones} renovación permitida`;
      });
      
    } else if (tipoUsuario === 'docente') {
      // Configuraciones específicas para docentes
      const limiteRenovaciones = 2; // Los docentes pueden renovar dos veces
      
      // Actualizar los textos informativos
      document.querySelectorAll('.info-renovaciones').forEach(el => {
        el.textContent = `${limiteRenovaciones} renovaciones permitidas`;
      });
    }
  }
  
  // Configurar UI según el perfil del usuario al cargar la página
  configurarUISegunPerfil();
});