// public/js/importar.js
document.addEventListener('DOMContentLoaded', function() {
    const importForm = document.getElementById('importForm');
    const resultados = document.getElementById('resultados');
    const totalElement = document.getElementById('total');
    const exitososElement = document.getElementById('exitosos');
    const fallidosElement = document.getElementById('fallidos');
    const erroresContainer = document.getElementById('errores');
    const listaErrores = document.getElementById('lista-errores');
    
    importForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(importForm);
      const archivoInput = document.getElementById('archivo');
      
      if (!archivoInput.files || archivoInput.files.length === 0) {
        alert('Por favor, selecciona un archivo CSV.');
        return;
      }
      
      // Cambiar el botón a "Importando..."
      const submitButton = importForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Importando...';
      submitButton.disabled = true;
      
      // Ocultar resultados anteriores
      resultados.classList.add('hidden');
      erroresContainer.classList.add('hidden');
      
      // Realizar la petición
      fetch('/api/importar/libros', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          // Mostrar resultados
          totalElement.textContent = data.resultados.total;
          exitososElement.textContent = data.resultados.exitosos;
          fallidosElement.textContent = data.resultados.fallidos;
          
          // Mostrar errores si hay
          if (data.resultados.errores && data.resultados.errores.length > 0) {
            listaErrores.innerHTML = '';
            
            data.resultados.errores.forEach(error => {
              const li = document.createElement('li');
              li.textContent = `${error.libro}: ${error.error}`;
              listaErrores.appendChild(li);
            });
            
            erroresContainer.classList.remove('hidden');
          }
          
          resultados.classList.remove('hidden');
          
          // Restaurar el botón
          submitButton.textContent = originalText;
          submitButton.disabled = false;
          
          // Limpiar el formulario
          importForm.reset();
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Ocurrió un error durante la importación. Por favor, inténtalo de nuevo.');
          
          // Restaurar el botón
          submitButton.textContent = originalText;
          submitButton.disabled = false;
        });
    });
  });