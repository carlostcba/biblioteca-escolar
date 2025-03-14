// public/js/importar.js
document.addEventListener('DOMContentLoaded', function() {
  const importForm = document.getElementById('importForm');
  const resultados = document.getElementById('resultados');
  const totalElement = document.getElementById('total');
  const exitososElement = document.getElementById('exitosos');
  const fallidosElement = document.getElementById('fallidos');
  const erroresContainer = document.getElementById('errores');
  const listaErrores = document.getElementById('lista-errores');
  const progressBar = document.getElementById('progress-bar');
  const progressContainer = document.getElementById('progress-container');
  const progressText = document.getElementById('progress-text');
  
  // Intervalo para verificar el progreso
  let progressInterval = null;
  
  // Verificar al cargar la página si hay una importación en curso
  checkActiveImport();
  
  // Función para verificar si hay una importación activa
  function checkActiveImport() {
    // Recuperar ID de importación guardado en localStorage
    const activeImportID = localStorage.getItem('activeImportID');
    
    if (activeImportID) {
      // Hay una importación guardada, verificar su estado
      fetch(`/api/importar/estado/${activeImportID}`)
        .then(response => {
          if (!response.ok) {
            if (response.status === 404) {
              // La importación ya no existe en el servidor
              localStorage.removeItem('activeImportID');
              return null;
            }
            throw new Error('Error al verificar estado');
          }
          return response.json();
        })
        .then(data => {
          if (!data) return; // La importación ya no existe
          
          // Mostrar notificación de que hay una importación existente
          showToast(`Recuperando importación previa (ID: ${activeImportID.slice(-6)})`, 'info');
          
          // Si la importación sigue en curso, continuar monitoreando
          if (data.estado === 'en_proceso') {
            // Mostrar y actualizar barra de progreso
            progressBar.style.width = `${data.progreso}%`;
            progressText.textContent = `Progreso: ${data.progreso}%`;
            progressContainer.classList.remove('hidden');
            
            // Deshabilitar el formulario
            const submitButton = importForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Importando...';
            submitButton.disabled = true;
            
            // Iniciar monitoreo
            startMonitoring(activeImportID);
          } else {
            // La importación ya terminó, mostrar resultados
            mostrarResultadosImportacion(data);
          }
        })
        .catch(error => {
          console.error('Error al verificar importación activa:', error);
          // Eliminar ID guardado en caso de error
          localStorage.removeItem('activeImportID');
        });
    }
  }
  
  // Iniciar monitoreo periódico de una importación
  function startMonitoring(importID) {
    // Limpiar intervalo anterior si existe
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    // Guardar ID en localStorage para recuperación
    localStorage.setItem('activeImportID', importID);
    
    // Configurar nuevo intervalo
    progressInterval = setInterval(() => {
      checkImportStatus(importID);
    }, 2000); // Verificar cada 2 segundos
  }
  
  // Función para verificar el estado de la importación
  function checkImportStatus(importID) {
    fetch(`/api/importar/estado/${importID}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al verificar estado');
        }
        return response.json();
      })
      .then(data => {
        // Actualizar barra de progreso
        progressBar.style.width = `${data.progreso}%`;
        progressText.textContent = `Progreso: ${data.progreso}%`;
        
        // Si la importación ha terminado o hay un error
        if (data.estado === 'completado' || data.estado === 'error') {
          clearInterval(progressInterval);
          mostrarResultadosImportacion(data);
          
          // Eliminar ID de importación activa
          localStorage.removeItem('activeImportID');
        }
      })
      .catch(error => {
        console.error('Error al verificar estado:', error);
        clearInterval(progressInterval);
        showToast('Error al verificar el estado de la importación', 'error');
        
        // Restaurar el botón
        const submitButton = importForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Importar Libros';
        submitButton.disabled = false;
        
        // Ocultar progreso
        progressContainer.classList.add('hidden');
        
        // Eliminar ID de importación activa
        localStorage.removeItem('activeImportID');
      });
  }
  
  // Función para mostrar los resultados de una importación
  function mostrarResultadosImportacion(data) {
    // Mostrar resultados finales
    totalElement.textContent = data.resultados.total;
    exitososElement.textContent = data.resultados.exitosos;
    fallidosElement.textContent = data.resultados.fallidos;
    
    // Mostrar errores si hay
    if (data.resultados.errores && data.resultados.errores.length > 0) {
      listaErrores.innerHTML = '';
      
      const errorsToShow = data.resultados.errores.slice(0, 50); // Limitar a 50 errores para evitar sobrecarga
      errorsToShow.forEach(error => {
        const li = document.createElement('li');
        li.textContent = `${error.libro}: ${error.error}`;
        listaErrores.appendChild(li);
      });
      
      if (data.resultados.errores.length > 50) {
        const li = document.createElement('li');
        li.textContent = `... y ${data.resultados.errores.length - 50} errores más`;
        listaErrores.appendChild(li);
      }
      
      erroresContainer.classList.remove('hidden');
    }
    
    resultados.classList.remove('hidden');
    
    // Ocultar progreso
    progressContainer.classList.add('hidden');
    
    // Restaurar el botón
    const submitButton = importForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Importar Libros';
    submitButton.disabled = false;
    
    // Mostrar notificación según el estado
    if (data.estado === 'completado') {
      showToast('Importación completada con éxito', 'success');
    } else {
      showToast('Error en la importación', 'error');
    }
  }
  
  // Función para mostrar notificaciones
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 5000);
  }
  
  importForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(importForm);
    const archivoInput = document.getElementById('archivo');
    
    if (!archivoInput.files || archivoInput.files.length === 0) {
      showToast('Por favor, selecciona un archivo CSV.', 'error');
      return;
    }
    
    // Verificar tamaño del archivo (opcional)
    if (archivoInput.files[0].size > 50 * 1024 * 1024) { // 50 MB
      showToast('El archivo es demasiado grande. Máximo 50 MB.', 'error');
      return;
    }
    
    // Cambiar el botón a "Importando..."
    const submitButton = importForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Iniciando importación...';
    submitButton.disabled = true;
    
    // Ocultar resultados anteriores
    resultados.classList.add('hidden');
    erroresContainer.classList.add('hidden');
    
    // Mostrar y reiniciar barra de progreso
    progressBar.style.width = '0%';
    progressText.textContent = 'Iniciando...';
    progressContainer.classList.remove('hidden');
    
    // Realizar la petición de inicio de importación
    fetch('/api/importar/libros', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error al iniciar la importación');
      }
      return response.json();
    })
    .then(data => {
      // Si la importación se inició con éxito
      if (data.estado === 'en_proceso') {
        submitButton.textContent = 'Importando...';
        
        // Iniciar verificación periódica del progreso
        startMonitoring(data.importID);
      } else {
        showToast('Error al iniciar la importación', 'error');
        progressContainer.classList.add('hidden');
        submitButton.textContent = 'Importar Libros';
        submitButton.disabled = false;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showToast('Ocurrió un error durante la importación', 'error');
      
      // Restaurar el botón
      submitButton.textContent = 'Importar Libros';
      submitButton.disabled = false;
      
      // Ocultar barra de progreso
      progressContainer.classList.add('hidden');
    });
  });
});