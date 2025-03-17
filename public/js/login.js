// public/js/login.js
document.addEventListener('DOMContentLoaded', function() {
  // Elementos DOM
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePassword = document.querySelector('.toggle-password');
  const errorMessage = document.getElementById('login-error');
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
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
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
      
      // Realizar petición al servidor
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
      const userInfo = {
        id: data.usuario.id,
        nombre: data.usuario.nombre,
        apellido: data.usuario.apellido,
        email: data.usuario.email,
        tipo_usuario: data.usuario.tipo_usuario
      };
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      
      // Indicar que acabamos de iniciar sesión
      sessionStorage.setItem('just_logged_in', 'true');
      
      // SOLUCIÓN: Redirigir según el tipo de usuario
      console.log('Inicio de sesión exitoso, redirigiendo según el rol...');
      
      // Decidir la URL de redirección según el tipo de usuario
      let redirectUrl = '/catalogo.html'; // Por defecto, ir al catálogo
      
      if (userInfo.tipo_usuario === 'administrador' || userInfo.tipo_usuario === 'bibliotecario') {
        redirectUrl = '/dashboard.html'; // Administradores y bibliotecarios van al dashboard
      }
      
      // Realizar la redirección
      window.location.href = redirectUrl;
      return; // Asegurarse de que no se ejecute nada más
      
    } catch (error) {
      console.error('Error en login:', error);
      showError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      
      // Restaurar botón
      resetButton();
    }
  }
  
  /**
   * Restaura el estado del botón de envío
   */
  function resetButton() {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
  
  /**
   * Muestra un mensaje de error
   * @param {string} message - Mensaje de error
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    // También resetear el botón cuando se muestra un error
    resetButton();
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