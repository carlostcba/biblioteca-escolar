// js/reportes.js
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info') ? JSON.parse(localStorage.getItem('user_info')) : null;
    
    if (!token || !userInfo) {
        window.location.href = '/login.html';
        return;
    }
    
    // Verificar autorización (solo admin puede acceder a reportes completos)
    if (userInfo.tipo_usuario !== 'administrador' && userInfo.tipo_usuario !== 'bibliotecario') {
        window.location.href = '/acceso-denegado.html';
        return;
    }
    
    // Elementos DOM
    const categories = document.querySelectorAll('.category');
    const periodoSelect = document.getElementById('periodo-select');
    const fechasPersonalizadas = document.getElementById('fechas-personalizadas');
    const fechaDesde = document.getElementById('fecha-desde');
    const fechaHasta = document.getElementById('fecha-hasta');
    const btnGenerar = document.getElementById('btn-generar');
    const btnExportar = document.getElementById('btn-exportar');
    const reportContainer = document.getElementById('report-container');
    
    // Contadores
    const totalPrestamos = document.getElementById('total-prestamos');
    const prestamosActivos = document.getElementById('prestamos-activos');
    const totalDevoluciones = document.getElementById('total-devoluciones');
    const tasaDevolucion = document.getElementById('tasa-devolucion');
    
    // Gráficos
    const chartDiario = document.getElementById('chart-diario');
    const chartCategorias = document.getElementById('chart-categorias');
    
    // Tablas
    const tablaLibros = document.getElementById('tabla-libros');
    const tablaUsuarios = document.getElementById('tabla-usuarios');
    
    // Estado de la aplicación
    let categoriaActiva = 'prestamos';
    let periodo = 'mes';
    let fechaInicio = obtenerFechaInicio('mes');
    let fechaFin = new Date().toISOString().split('T')[0]; // Hoy en formato YYYY-MM-DD
    
    // Event Listeners
    categories.forEach(category => {
        category.addEventListener('click', function() {
            cambiarCategoria(this.getAttribute('data-category'));
        });
    });
    
    periodoSelect.addEventListener('change', function() {
        periodo = this.value;
        
        if (periodo === 'personalizado') {
            fechasPersonalizadas.classList.remove('hidden');
        } else {
            fechasPersonalizadas.classList.add('hidden');
            fechaInicio = obtenerFechaInicio(periodo);
            fechaFin = new Date().toISOString().split('T')[0];
        }
    });
    
    fechaDesde.addEventListener('change', function() {
        fechaInicio = this.value;
    });
    
    fechaHasta.addEventListener('change', function() {
        fechaFin = this.value;
    });
    
    btnGenerar.addEventListener('click', generarReporte);
    btnExportar.addEventListener('click', exportarReporte);
    
    // Inicializar la página
    inicializarFechas();
    generarReporte();
    
    /**
     * Inicializa los campos de fecha con valores por defecto
     */
    function inicializarFechas() {
        // Establecer fechas por defecto (este mes)
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        
        fechaDesde.value = primerDiaMes.toISOString().split('T')[0];
        fechaHasta.value = hoy.toISOString().split('T')[0];
    }
    
    /**
     * Cambia la categoría activa de reportes
     * @param {string} categoria - Nueva categoría
     */
    function cambiarCategoria(categoria) {
        categoriaActiva = categoria;
        
        // Actualizar UI
        categories.forEach(cat => {
            if (cat.getAttribute('data-category') === categoria) {
                cat.classList.add('active');
            } else {
                cat.classList.remove('active');
            }
        });
        
        // Regenerar el reporte
        generarReporte();
    }
    
    /**
     * Obtiene la fecha de inicio según el período seleccionado
     * @param {string} periodo - Período seleccionado
     * @returns {string} - Fecha de inicio en formato YYYY-MM-DD
     */
    function obtenerFechaInicio(periodo) {
        const hoy = new Date();
        let fechaInicio;
        
        switch (periodo) {
            case 'mes':
                // Primer día del mes actual
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                break;
            case 'trimestre':
                // 3 meses atrás
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate());
                break;
            case 'semestre':
                // 6 meses atrás
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 6, hoy.getDate());
                break;
            case 'anio':
                // 1 año atrás
                fechaInicio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
                break;
            default:
                // Por defecto, primer día del mes
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        }
        
        return fechaInicio.toISOString().split('T')[0];
    }
    
    /**
     * Genera el reporte según la categoría y período seleccionados
     */
    async function generarReporte() {
        try {
            // Mostrar indicador de carga
            reportContainer.classList.add('loading');
            
            // Construir URL de la API
            let url = `/api/reportes/${categoriaActiva}?desde=${fechaInicio}&hasta=${fechaFin}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al generar el reporte');
            }
            
            const data = await response.json();
            
            // Actualizar la UI con los datos del reporte
            actualizarDatosReporte(data);
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al generar el reporte', 'error');
        } finally {
            reportContainer.classList.remove('loading');
        }
    }
    
    /**
     * Actualiza la UI con los datos del reporte
     * @param {Object} data - Datos del reporte
     */
    function actualizarDatosReporte(data) {
        // Actualizar según la categoría activa
        switch (categoriaActiva) {
            case 'prestamos':
                actualizarReportePrestamos(data);
                break;
            case 'libros':
                actualizarReporteLibros(data);
                break;
            case 'usuarios':
                actualizarReporteUsuarios(data);
                break;
            case 'general':
                actualizarReporteGeneral(data);
                break;
        }
    }
    
    /**
     * Actualiza la UI con los datos del reporte de préstamos
     * @param {Object} data - Datos del reporte de préstamos
     */
    function actualizarReportePrestamos(data) {
        // Actualizar contadores
        totalPrestamos.textContent = data.totalPrestamos || 0;
        prestamosActivos.textContent = data.prestamosActivos || 0;
        totalDevoluciones.textContent = data.totalDevoluciones || 0;
        
        // Calcular tasa de devolución
        const tasa = data.totalPrestamos > 0 ? 
            ((data.totalDevoluciones / data.totalPrestamos) * 100).toFixed(1) : 0;
        tasaDevolucion.textContent = tasa + '%';
        
        // Renderizar gráfico de préstamos diarios
        renderizarGraficoDiario(data.prestamosPorDia || []);
        
        // Renderizar gráfico de distribución por categoría
        renderizarGraficoCategorias(data.prestamosPorCategoria || []);
        
        // Actualizar tabla de libros más prestados
        actualizarTablaLibros(data.librosMasPrestados || []);
        
        // Actualizar tabla de usuarios más activos
        actualizarTablaUsuarios(data.usuariosMasActivos || []);
    }
    
    /**
     * Actualiza la UI con los datos del reporte de libros
     * @param {Object} data - Datos del reporte de libros
     */
    function actualizarReporteLibros(data) {
        // Implementar según los datos específicos del reporte de libros
        console.log('Reporte de libros:', data);
    }
    
    /**
     * Actualiza la UI con los datos del reporte de usuarios
     * @param {Object} data - Datos del reporte de usuarios
     */
    function actualizarReporteUsuarios(data) {
        // Implementar según los datos específicos del reporte de usuarios
        console.log('Reporte de usuarios:', data);
    }
    
    /**
     * Actualiza la UI con los datos del reporte general
     * @param {Object} data - Datos del reporte general
     */
    function actualizarReporteGeneral(data) {
        // Implementar según los datos específicos del reporte general
        console.log('Reporte general:', data);
    }
    
    /**
     * Renderiza el gráfico de préstamos diarios
     * @param {Array} datos - Datos para el gráfico
     */
    function renderizarGraficoDiario(datos) {
        // Aquí se implementaría la lógica para renderizar un gráfico
        // Usando una biblioteca como Chart.js
        
        // Ejemplo simple de visualización
        chartDiario.innerHTML = '';
        
        if (datos.length === 0) {
            chartDiario.innerHTML = '<div class="no-data">No hay datos disponibles para el período seleccionado</div>';
            return;
        }
        
        // Crear un contenedor para el gráfico
        const chartContainer = document.createElement('div');
        chartContainer.classList.add('chart-container-simple');
        
        // Encontrar el valor máximo para escalar correctamente
        const maxValue = Math.max(...datos.map(item => item.cantidad));
        
        // Crear barras para cada día
        datos.forEach(item => {
            const barContainer = document.createElement('div');
            barContainer.classList.add('bar-container');
            
            const bar = document.createElement('div');
            bar.classList.add('bar');
            bar.style.height = `${(item.cantidad / maxValue) * 100}%`;
            
            const label = document.createElement('div');
            label.classList.add('bar-label');
            label.textContent = item.fecha.split('-')[2]; // Mostrar solo el día
            
            const value = document.createElement('div');
            value.classList.add('bar-value');
            value.textContent = item.cantidad;
            
            barContainer.appendChild(value);
            barContainer.appendChild(bar);
            barContainer.appendChild(label);
            
            barContainer.title = `${item.fecha}: ${item.cantidad} préstamos`;
            
            chartContainer.appendChild(barContainer);
        });
        
        chartDiario.appendChild(chartContainer);
    }
    
    /**
     * Renderiza el gráfico de distribución por categoría
     * @param {Array} datos - Datos para el gráfico
     */
    function renderizarGraficoCategorias(datos) {
        // Aquí se implementaría la lógica para renderizar un gráfico de pastel
        // Usando una biblioteca como Chart.js
        
        // Ejemplo simple de visualización
        chartCategorias.innerHTML = '';
        
        if (datos.length === 0) {
            chartCategorias.innerHTML = '<div class="no-data">No hay datos disponibles para el período seleccionado</div>';
            return;
        }
        
        // Crear un contenedor para el gráfico
        const chartContainer = document.createElement('div');
        chartContainer.classList.add('pie-chart-simple');
        
        // Colores para las categorías
        const colores = [
            '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
            '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
        ];
        
        // Calcular el total para los porcentajes
        const total = datos.reduce((sum, item) => sum + item.cantidad, 0);
        
        // Crear la lista de categorías
        const lista = document.createElement('ul');
        lista.classList.add('pie-legend');
        
        datos.forEach((item, index) => {
            const color = colores[index % colores.length];
            const porcentaje = ((item.cantidad / total) * 100).toFixed(1);
            
            const listItem = document.createElement('li');
            listItem.classList.add('legend-item');
            
            const colorBox = document.createElement('span');
            colorBox.classList.add('color-box');
            colorBox.style.backgroundColor = color;
            
            const label = document.createElement('span');
            label.classList.add('legend-label');
            label.textContent = `${item.categoria}: ${item.cantidad} (${porcentaje}%)`;
            
            listItem.appendChild(colorBox);
            listItem.appendChild(label);
            lista.appendChild(listItem);
        });
        
        chartContainer.appendChild(lista);
        chartCategorias.appendChild(chartContainer);
    }
    
    /**
     * Actualiza la tabla de libros más prestados
     * @param {Array} libros - Lista de libros más prestados
     */
    function actualizarTablaLibros(libros) {
        tablaLibros.innerHTML = '';
        
        if (libros.length === 0) {
            tablaLibros.innerHTML = '<tr><td colspan="4" class="no-data">No hay datos disponibles</td></tr>';
            return;
        }
        
        // Crear encabezado
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Título</th>
                <th>Autor</th>
                <th>Categoría</th>
                <th>Préstamos</th>
            </tr>
        `;
        tablaLibros.appendChild(thead);
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        libros.forEach(libro => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${libro.titulo}</td>
                <td>${libro.autor}</td>
                <td>${libro.categoria || '-'}</td>
                <td>${libro.prestamos}</td>
            `;
            tbody.appendChild(tr);
        });
        
        tablaLibros.appendChild(tbody);
    }
    
    /**
     * Actualiza la tabla de usuarios más activos
     * @param {Array} usuarios - Lista de usuarios más activos
     */
    function actualizarTablaUsuarios(usuarios) {
        tablaUsuarios.innerHTML = '';
        
        if (usuarios.length === 0) {
            tablaUsuarios.innerHTML = '<tr><td colspan="4" class="no-data">No hay datos disponibles</td></tr>';
            return;
        }
        
        // Crear encabezado
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Usuario</th>
                <th>Tipo</th>
                <th>Préstamos</th>
                <th>Devoluciones</th>
            </tr>
        `;
        tablaUsuarios.appendChild(thead);
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${usuario.nombre} ${usuario.apellido}</td>
                <td>${usuario.tipo}</td>
                <td>${usuario.prestamos}</td>
                <td>${usuario.devoluciones}</td>
            `;
            tbody.appendChild(tr);
        });
        
        tablaUsuarios.appendChild(tbody);
    }
    
    /**
     * Exporta el reporte actual
     */
    async function exportarReporte() {
        try {
            // Mostrar opciones de exportación
            const formatoExport = prompt('Selecciona el formato de exportación (csv, pdf, excel):', 'csv');
            
            if (!formatoExport) return;
            
            // Validar formato
            if (!['csv', 'pdf', 'excel'].includes(formatoExport.toLowerCase())) {
                mostrarNotificacion('Formato no válido. Opciones disponibles: csv, pdf, excel', 'error');
                return;
            }
            
            // Mostrar indicador de carga
            btnExportar.disabled = true;
            btnExportar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';
            
            // Construir URL de la API
            let url = `/api/reportes/${categoriaActiva}/exportar?desde=${fechaInicio}&hasta=${fechaFin}&formato=${formatoExport}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al exportar el reporte');
            }
            
            // Obtener el blob según el formato
            let blob;
            if (formatoExport === 'csv') {
                blob = await response.blob();
            } else if (formatoExport === 'pdf') {
                blob = await response.blob();
            } else if (formatoExport === 'excel') {
                blob = await response.blob();
            }
            
            // Crear URL para descargar
            const url_descarga = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url_descarga;
            a.download = `reporte_${categoriaActiva}_${fechaInicio}_${fechaFin}.${formatoExport}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url_descarga);
            
            // Mostrar mensaje de éxito
            mostrarNotificacion(`Reporte exportado exitosamente en formato ${formatoExport.toUpperCase()}`);
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al exportar el reporte', 'error');
        } finally {
            // Restaurar botón
            btnExportar.disabled = false;
            btnExportar.innerHTML = '<i class="fas fa-download"></i> Exportar';
        }
    }
    
    /**
     * Muestra una notificación en pantalla
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de notificación ('success', 'error', 'warning')
     */
    function mostrarNotificacion(mensaje, tipo = 'success') {
        // Crear contenedor de notificación si no existe
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
        
        // Configurar event listener para cerrar
        notificacionItem.querySelector('.notification-close').addEventListener('click', () => {
            notificacionItem.classList.add('notification-hide');
            setTimeout(() => {
                notificacionItem.remove();
            }, 300);
        });
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            if (notificacionItem.parentNode) {
                notificacionItem.classList.add('notification-hide');
                setTimeout(() => {
                    notificacionItem.remove();
                }, 300);
            }
        }, 5000);
    }
});