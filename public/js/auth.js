// public/js/auth.js
document.addEventListener('DOMContentLoaded', function() {
    // Comprobar si el usuario está autenticado (token en localStorage/sessionStorage)
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info') ? JSON.parse(localStorage.getItem('user_info')) : null;
    
    // Elementos DOM
    const guestElements = document.querySelectorAll('.guest-only');
    const userElements = document.querySelectorAll('.user-only');
    const adminElements = document.querySelectorAll('.admin-only');
    const userName = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Función para actualizar la interfaz según el estado de autenticación
    function updateAuthUI() {
      if (token && userInfo) {
        // Usuario autenticado
        guestElements.forEach(el => el.classList.add('hidden'));
        userElements.forEach(el => el.classList.remove('hidden'));
        
        // Mostrar el nombre del usuario
        if (userName) {
          userName.textContent = `${userInfo.nombre} ${userInfo.apellido}`;
        }
        
        // Mostrar elementos de administrador si corresponde
        if (userInfo.tipo === 'administrador' || userInfo.tipo === 'bibliotecario') {
          adminElements.forEach(el => el.classList.remove('hidden'));
        }
      } else {
        // Usuario no autenticado
        guestElements.forEach(el => el.classList.remove('hidden'));
        userElements.forEach(el => el.classList.add('hidden'));
        adminElements.forEach(el => el.classList.add('hidden'));
      }
    }
    
    // Verificar la autenticación con el servidor
    async function verifyAuth() {
      if (!token) return;
      
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          // Token inválido, cerrar sesión
          logout();
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
      }
    }
    
    // Función para cerrar sesión
    function logout() {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      
      // Redirigir a la página de inicio
      window.location.href = '/';
    }
    
    // Event listener para botón de logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
      });
    }
    
    // Toggle del menú desplegable
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
      dropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        this.nextElementSibling.classList.toggle('show');
      });
      
      // Cerrar dropdown al hacer clic fuera
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
          const dropdowns = document.querySelectorAll('.dropdown-menu');
          dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
        }
      });
    }
    
    // Actualizar la interfaz inicial
    updateAuthUI();
    
    // Verificar autenticación con el servidor
    verifyAuth();
  });