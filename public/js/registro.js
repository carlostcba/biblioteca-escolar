// public/js/registro.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const registroForm = document.getElementById('registro-form');
    const tipoUsuarioSelect = document.getElementById('tipo_usuario');
    const camposAlumno = document.getElementById('campos-alumno');
    const camposDocente = document.getElementById('campos-docente');
    const nivelSelect = document.getElementById('nivel');
    const gradoSelect = document.getElementById('grado');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('password_confirm');
    const togglePassword = document.querySelectorAll('.toggle-password');
    const errorMessage = document.getElementById('registro-error');
    
    // Event Listeners
    registroForm.addEventListener('submit', handleRegistro);
    tipoUsuarioSelect.addEventListener('change', togglePerfilFields);
    nivelSelect?.addEventListener('change', updateGradoOptions);
    
    // Toggle mostrar/ocultar contraseña
    togglePassword.forEach(element => {
      element.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
      });
    });
    
    /**
     * Muestra/oculta campos según el tipo de usuario
     */
    function togglePerfilFields() {
      const selectedValue = tipoUsuarioSelect.value;
      
      // Ocultar todos los campos específicos
      const perfilCampos = document.querySelectorAll('.perfil-campos');
      perfilCampos.forEach(campo => campo.classList.add('hidden'));
      
      // Mostrar campos según el tipo seleccionado
      if (selectedValue === 'alumno') {
        camposAlumno.classList.remove('hidden');
        // Actualizar las opciones de grado
        updateGradoOptions();
      } else if (selectedValue === 'docente') {
        camposDocente.classList.remove('hidden');
      }
    }
    
    /**
     * Actualiza las opciones de grado según el nivel educativo
     */
    function updateGradoOptions() {
      if (!nivelSelect || !gradoSelect) return;
      
      const nivel = nivelSelect.value;
      gradoSelect.innerHTML = '<option value="" disabled selected>Selecciona tu grado</option>';
      
      if (!nivel) return;
      
      let maxGrado = 6; // Por defecto para primaria
      
      if (nivel === 'secundaria_basica' || nivel === 'secundaria_tecnica') {
        maxGrado = 3;
      }
      
      for (let i = 1; i <= maxGrado; i++) {
        const option = document.createElement('option');
        option.value = i.toString();
        option.textContent = i.toString() + '°';
        gradoSelect.appendChild(option);
      }
    }
    
    /**
     * Maneja el envío del formulario de registro
     * @param {Event} event - Evento de submit
     */
    async function handleRegistro(event) {
      event.preventDefault();
      
      // Resetear mensaje de error
      hideError();
      
      // Validar el formulario
      if (!validateForm()) {
        return;
      }
      
      // Recopilar datos del formulario
      const formData = new FormData(registroForm);
      const userData = {};
      
      // Convertir FormData a objeto
      for (const [key, value] of formData.entries()) {
        userData[key] = value;
      }
      
      // Eliminar campos innecesarios según el tipo de usuario
      if (userData.tipo_usuario === 'alumno') {
        delete userData.departamento;
        delete userData.codigo_empleado;
      } else if (userData.tipo_usuario === 'docente') {
        delete userData.nivel;
        delete userData.grado;
        delete userData.grupo;
        delete userData.turno;
        delete userData.matricula;
      } else {
        // Para personal administrativo, eliminar todos los campos específicos
        delete userData.nivel;
        delete userData.grado;
        delete userData.grupo;
        delete userData.turno;
        delete userData.matricula;
        delete userData.departamento;
        delete userData.codigo_empleado;
      }
      
      // Eliminar campos de verificación
      delete userData.password_confirm;
      delete userData.terms;
      
      try {
        // Mostrar indicador de carga
        const submitBtn = registroForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
        
        // Realizar petición al servidor
        const response = await fetch('/api/auth/registro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Error al crear la cuenta.');
        }
        
        // Mostrar mensaje de éxito y redireccionar
        alert('¡Cuenta creada con éxito! Un administrador revisará tu solicitud. Recibirás una notificación cuando tu cuenta sea aprobada.');
        window.location.href = '/login.html';
        
      } catch (error) {
        console.error('Error en registro:', error);
        showError(error.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
        
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
    
    /**
     * Valida el formulario de registro
     * @returns {boolean} - Resultado de la validación
     */
    function validateForm() {
      // Validar campos básicos
      const nombre = document.getElementById('nombre').value.trim();
      const apellido = document.getElementById('apellido').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = passwordInput.value;
      const passwordConfirm = passwordConfirmInput.value;
      const tipoUsuario = tipoUsuarioSelect.value;
      const terms = document.getElementById('terms').checked;
      
      if (!nombre || !apellido || !email || !password || !passwordConfirm || !tipoUsuario) {
        showError('Por favor, completa todos los campos obligatorios.');
        return false;
      }
      
      // Validar formato de email
      if (!isValidEmail(email)) {
        showError('Por favor, ingresa un correo electrónico válido.');
        return false;
      }
      
      // Validar contraseña
      if (password.length < 8) {
        showError('La contraseña debe tener al menos 8 caracteres.');
        return false;
      }
      
      if (!/[A-Z]/.test(password)) {
        showError('La contraseña debe contener al menos una letra mayúscula.');
        return false;
      }
      
      if (!/[0-9]/.test(password)) {
        showError('La contraseña debe contener al menos un número.');
        return false;
      }
      
      // Validar confirmación de contraseña
      if (password !== passwordConfirm) {
        showError('Las contraseñas no coinciden.');
        return false;
      }
      
      // Validar campos específicos según tipo de usuario
      if (tipoUsuario === 'alumno') {
        const nivel = document.getElementById('nivel').value;
        const grado = document.getElementById('grado').value;
        const turno = document.getElementById('turno').value;
        
        if (!nivel || !grado || !turno) {
          showError('Por favor, completa todos los campos del perfil de alumno.');
          return false;
        }
      } else if (tipoUsuario === 'docente') {
        const departamento = document.getElementById('departamento').value;
        
        if (!departamento) {
          showError('Por favor, selecciona tu departamento.');
          return false;
        }
      }
      
      // Validar términos y condiciones
      if (!terms) {
        showError('Debes aceptar los términos y condiciones para continuar.');
        return false;
      }
      
      return true;
    }
    
    /**
     * Muestra un mensaje de error
     * @param {string} message - Mensaje de error
     */
    function showError(message) {
      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');
      
      // Hacer scroll hacia el mensaje de error
      errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
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