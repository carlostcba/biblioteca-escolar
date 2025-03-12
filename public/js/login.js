// public/js/login.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('.toggle-password');
    const errorMessage = document.getElementById('login-error');
    
    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    
    // Toggle mostrar/ocultar contraseña
    if (togglePassword) {
      togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
      });
    }
    
    /**
     * Maneja el envío del formulario de login
     * @param {Event} event - Evento de submit
     */
    async function handleLogin(event) {
      event.preventDefault();
      
      // Obtener valores del formulario
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const remember = document.getElementById('remember')?.checked || false;
      
      // Resetear mensaje de error
      hideError();
      
      // Validación básica
      if (!email || !password) {
        showError('Por favor, completa todos los campos.');
        return;
      }
      
      // Validar formato de email
      if (!isValidEmail(email)) {
        showError('Por favor, ingresa un correo electrónico válido.');
        return;
      }
      
      try {
        // Mostrar indicador de carga
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        
        // Realizar petición al servidor (usando fetch)
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, remember })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Error al iniciar sesión.');
        }
        
        // Guardar token en localStorage o sessionStorage según "remember"
        if (remember) {
          localStorage.setItem('auth_token', data.token);
        } else {
          sessionStorage.setItem('auth_token', data.token);
        }
        
        // Guardar información básica del usuario
        localStorage.setItem('user_info', JSON.stringify({
          id: data.usuario.id,
          nombre: data.usuario.nombre,
          apellido: data.usuario.apellido,
          email: data.usuario.email,
          tipo: data.usuario.tipo_usuario
        }));
        
        // Redireccionar según el tipo de usuario
        redirectByUserType(data.usuario.tipo_usuario);
        
      } catch (error) {
        console.error('Error en login:', error);
        showError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
    
    /**
     * Redirecciona al usuario según su tipo
     * @param {string} userType - Tipo de usuario
     */
    function redirectByUserType(userType) {
      // Verificar si hay una URL de redirección guardada (para retornar después del login)
      const redirectUrl = getRedirectUrl();
      
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      
      // Si no hay redirección guardada, enviar según el tipo de usuario
      switch (userType) {
        case 'administrador':
          window.location.href = '/dashboard.html';
          break;
        case 'bibliotecario':
          window.location.href = '/dashboard.html';
          break;
        case 'docente':
        case 'alumno':
        default:
          window.location.href = '/catalogo.html';
          break;
      }
    }
    
    /**
     * Obtiene la URL de redirección guardada en localStorage
     * @returns {string|null} - URL de redirección o null si no existe
     */
    function getRedirectUrl() {
      const redirectUrl = localStorage.getItem('auth_redirect');
      if (redirectUrl) {
        localStorage.removeItem('auth_redirect');
        return redirectUrl;
      }
      return null;
    }
    
    /**
     * Muestra un mensaje de error
     * @param {string} message - Mensaje de error
     */
    function showError(message) {
      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');
    }
    
    /**
     * Oculta el mensaje de error
     */
    function hideError() {
      errorMessage.textContent = '';
      errorMessage.classList.add('hidden');
    }
    
    /**
     * Valida el formato de un email
     * @param {string} email - Email a validar
     * @returns {boolean} - Resultado de la validación
     */
    function isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  });