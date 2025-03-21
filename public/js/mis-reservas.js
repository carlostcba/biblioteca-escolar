// js/mis-reservas.js
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info') ? JSON.parse(localStorage.getItem('user_info')) : null;
    
    if (!token || !userInfo) {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }
    
    // Elementos DOM
    const tabs = document.querySelectorAll('.tab');
    const reservasContainer = document.getElementById('reservas-container');
    const prestamosContainer = document.getElementById('prestamos-container');
    const emptyState = document.getElementById('empty-state');
    const modalCancelar = document.getElementById('modal-cancelar');
    const modalRenovar = document.getElementById('modal-renovar');
    
    // Estado de la aplicación
    let tabActiva = 'activas';
    let reservaSeleccionada = null;
    let prestamoSeleccionado = null;
    
    // Event Listeners
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        cambiarTab(this.getAttribute('data-tab'));
      });
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
          const fechaReserva = new Date(reserva.FechaReserva).toLocaleDateString();
          const fechaExpiracion = new Date(reserva.FechaExpiracion).toLocaleDateString();
          
          const reservaElement = document.createElement('div');
          reservaElement.classList.add('reserva-card');
          
          // Determinar clase de estado
          let estadoClass = '';
          switch (reserva.Estado) {
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
              <h3 class="reserva-titulo">${reserva.libro.Titulo}</h3>
              <div class="reserva-detalles">
                <p><strong>ISBN:</strong> ${reserva.libro.ISBN || 'No disponible'}</p>
                <p><strong>Reservado el:</strong> ${fechaReserva}</p>
                <p><strong>Disponible hasta:</strong> ${fechaExpiracion}</p>
              </div>
              <div class="reserva-estado">
                <span class="status-badge ${estadoClass}">${reserva.Estado}</span>
              </div>
            </div>
            <div class="reserva-acciones">
              ${reserva.Estado === 'pendiente' ? 
                `<button class="btn btn-danger btn-sm btn-cancelar-reserva" data-id="${reserva.ReservaID}">
                  <i class="fas fa-times"></i> Cancelar
                </button>` : ''}
              ${reserva.Estado === 'lista' ? 
                `<p class="reserva-nota"><i class="fas fa-info-circle"></i> Lista para recoger</p>` : ''}
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
        
        prestamosContainer.innerHTML = '';
        
        if (!prestamos || prestamos.length === 0) {
          prestamosContainer.innerHTML = `
            <div class="empty-state small">
              <p>No tienes préstamos activos</p>
            </div>
          `;
          return;
        }
        
        prestamos.forEach(prestamo => {
            const fechaPrestamo = new Date(prestamo.FechaPrestamo).toLocaleDateString();
            const fechaDevolucion = new Date(prestamo.FechaDevolucion).toLocaleDateString();
            
            const prestamoElement = document.createElement('div');
            prestamoElement.classList.add('prestamo-card');
            
            // Determinar clase de estado
            let estadoClass = '';
            switch (prestamo.Estado) {
              case 'activo':
                estadoClass = 'status-active';
                break;
              case 'vencido':
                estadoClass = 'status-overdue';
                break;
              default:
                estadoClass = '';
            }
            
            prestamoElement.innerHTML = `
              <div class="prestamo-info">
                <h3 class="prestamo-titulo">${prestamo.libro.Titulo}</h3>
                <div class="prestamo-detalles">
                  <p><strong>Fecha de préstamo:</strong> ${fechaPrestamo}</p>
                  <p><strong>Fecha de devolución:</strong> ${fechaDevolucion}</p>
                  <p><strong>Ejemplar:</strong> ${prestamo.ejemplar ? prestamo.ejemplar.CodigoBarras : 'No disponible'}</p>
                </div>
                <div class="prestamo-estado">
                  <span class="status-badge ${estadoClass}">${prestamo.Estado}</span>
                </div>
              </div>
              <div class="prestamo-acciones">
                ${prestamo.Estado === 'activo' ? 
                  `<button class="btn btn-primary btn-sm btn-renovar-prestamo" data-id="${prestamo.PrestamoID}">
                    <i class="fas fa-sync-alt"></i> Renovar
                  </button>` : ''}
              </div>
            `;
            
            prestamosContainer.appendChild(prestamoElement);
          });
          
          // Agregar event listeners para botones de renovar
          document.querySelectorAll('.btn-renovar-prestamo').forEach(btn => {
            btn.addEventListener('click', function() {
              const prestamoId = this.getAttribute('data-id');
              abrirModalRenovar(prestamoId);
            });
          });
          
        } catch (error) {
          console.error('Error:', error);
          prestamosContainer.innerHTML = `
            <div class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              <p>Error al cargar tus préstamos. Por favor, intenta nuevamente.</p>
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
          document.getElementById('modal-titulo-cancelar').textContent = reserva.libro.Titulo;
          
          // Mostrar modal
          modalCancelar.classList.remove('hidden');
          
          // Configurar event listeners
          const btnNoCancelar = document.getElementById('btn-no-cancelar');
          const btnSiCancelar = document.getElementById('btn-si-cancelar');
          const closeBtn = modalCancelar.querySelector('.modal-close');
          
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              modalCancelar.classList.add('hidden');
            });
          }
          
          if (btnNoCancelar) {
            btnNoCancelar.addEventListener('click', () => {
              modalCancelar.classList.add('hidden');
            });
          }
          
          if (btnSiCancelar) {
            btnSiCancelar.removeEventListener('click', cancelarReserva);
            btnSiCancelar.addEventListener('click', cancelarReserva);
          }
          
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
          const btnSiCancelar = document.getElementById('btn-si-cancelar');
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
          modalCancelar.classList.add('hidden');
          
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
          document.getElementById('modal-titulo-renovar').textContent = prestamo.libro.Titulo;
          
          // Mostrar modal
          modalRenovar.classList.remove('hidden');
          
          // Configurar event listeners
          const btnCancelarRenovacion = document.getElementById('btn-cancelar-renovacion');
          const btnConfirmarRenovacion = document.getElementById('btn-confirmar-renovacion');
          const closeBtn = modalRenovar.querySelector('.modal-close');
          
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              modalRenovar.classList.add('hidden');
            });
          }
          
          if (btnCancelarRenovacion) {
            btnCancelarRenovacion.addEventListener('click', () => {
              modalRenovar.classList.add('hidden');
            });
          }
          
          if (btnConfirmarRenovacion) {
            btnConfirmarRenovacion.removeEventListener('click', renovarPrestamo);
            btnConfirmarRenovacion.addEventListener('click', renovarPrestamo);
          }
          
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
          const btnConfirmarRenovacion = document.getElementById('btn-confirmar-renovacion');
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
          modalRenovar.classList.add('hidden');
          
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
    });