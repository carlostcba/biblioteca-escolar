// public/js/login.js
document.addEventListener('DOMContentLoaded', function() {
  // Elementos del DOM
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePassword = document.querySelector('.toggle-password');
  const errorMessage = document.getElementById('login-error');
  let submitBtn; // Definir pero asignar más tarde
  
  // Asignar el botón de submit una vez que tengamos el formulario
  if (loginForm) {
      submitBtn = loginForm.querySelector('button[type="submit"]');
  }
  
  // Event Listeners
  if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
  }
  
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
      if (errorMessage) {
          errorMessage.textContent = '';
          errorMessage.classList.add('hidden');
      }
      
      // Validación básica
      if (!email || !password) {
          showError('Por favor, completa todos los campos.');
          return;
      }
      
      // Validar formato de email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showError('Por favor, ingresa un correo electrónico válido.');
          return;
      }
      
      // Guardar el texto original del botón
      const originalText = submitBtn ? submitBtn.innerHTML : 'Iniciar Sesión';
      
      // Deshabilitar el botón y mostrar cargando
      if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
      }
      
      try {
          // Realizar petición al servidor
          const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email, password, remember })
          });
          
          const data = await response.json();
          
          // Si la respuesta no es OK, lanzar un error
          if (!response.ok) {
              throw new Error(data.message || 'Error al iniciar sesión.');
          }
          
          // Si llegamos aquí, el login fue exitoso
          // Guardar token según remember
          if (remember) {
              localStorage.setItem('auth_token', data.token);
          } else {
              sessionStorage.setItem('auth_token', data.token);
          }
          
          // Guardar info básica del usuario
          localStorage.setItem('user_info', JSON.stringify({
              id: data.usuario.id,
              nombre: data.usuario.nombre,
              apellido: data.usuario.apellido,
              email: data.usuario.email,
              tipo: data.usuario.tipo_usuario
          }));
          
          // Redireccionar según tipo de usuario
          redirectToUserPage(data.usuario.tipo_usuario);
          
      } catch (error) {
          console.error('Error en login:', error);
          
          // Mostrar mensaje de error
          showError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
          
          // IMPORTANTE: Restaurar el botón siempre en caso de error
          if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
          }
      }
  }
  
  /**
   * Muestra un mensaje de error
   * @param {string} message - Mensaje de error
   */
  function showError(message) {
      if (errorMessage) {
          errorMessage.textContent = message;
          errorMessage.classList.remove('hidden');
      } else {
          // Fallback si no se encuentra el elemento de error
          alert(message);
      }
      
      // Asegurarse de que el botón se restaura
      if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Iniciar Sesión';
      }
  }
  
  /**
   * Redirecciona al usuario según su tipo
   * @param {string} userType - Tipo de usuario
   */
  function redirectToUserPage(userType) {
      // Verificar si hay URL de redirección guardada
      const redirectUrl = localStorage.getItem('auth_redirect');
      
      if (redirectUrl) {
          localStorage.removeItem('auth_redirect');
          window.location.href = redirectUrl;
          return;
      }
      
      // Redireccionar según tipo de usuario
      switch (userType) {
          case 'administrador':
          case 'bibliotecario':
              window.location.href = '/dashboard.html';
              break;
          case 'docente':
          case 'alumno':
          case 'personal':
          default:
              window.location.href = '/catalogo.html';
              break;
      }
  }
});