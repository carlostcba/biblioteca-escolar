// js/perfiles.js
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info') ? JSON.parse(localStorage.getItem('user_info')) : null;
    
    if (!token || !userInfo) {
        window.location.href = '/login.html';
        return;
    }
    
    // Verificar autorización (solo admin puede acceder)
    if (userInfo.tipo_usuario !== 'administrador') {
        window.location.href = '/acceso-denegado.html';
        return;
    }
    
    // Elementos DOM
    const usuariosLista = document.getElementById('usuarios-lista');
    const btnNuevoUsuario = document.getElementById('btn-nuevo-usuario');
    const btnImportarUsuarios = document.getElementById('btn-importar-usuarios');
    const paginacion = document.getElementById('paginacion');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const tipoUsuarioFiltro = document.getElementById('tipo-usuario-filtro');
    const nivelFiltro = document.getElementById('nivel-filtro');
    const gradoFiltro = document.getElementById('grado-filtro');
    const turnoFiltro = document.getElementById('turno-filtro');
    const buscarTexto = document.getElementById('buscar-texto');
    
    // Contadores estadísticos
    const totalAlumnos = document.getElementById('total-alumnos');
    const totalDocentes = document.getElementById('total-docentes');
    const totalPrimaria = document.getElementById('total-primaria');
    const totalSecundaria = document.getElementById('total-secundaria');
    
    // Estado de la aplicación
    let paginaActual = 1;
    let filtros = {
        tipo: '',
        nivel: '',
        grado: '',
        turno: '',
        busqueda: ''
    };
    
    // Event Listeners
    btnNuevoUsuario.addEventListener('click', abrirModalNuevoUsuario);
    btnImportarUsuarios.addEventListener('click', abrirModalImportarUsuarios);
    btnFiltrar.addEventListener('click', aplicarFiltros);
    
    // Event listeners para filtros (cambio de nivel actualiza opciones de grado)
    nivelFiltro.addEventListener('change', function() {
        actualizarOpcionesGrado(this.value);
    });
    
    // Cargar datos iniciales
    cargarEstadisticas();
    cargarUsuarios();
    
    /**
     * Carga las estadísticas de perfiles
     */
    async function cargarEstadisticas() {
        try {
            const response = await fetch('/api/perfiles/estadisticas', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar estadísticas');
            }
            
            const data = await response.json();
            
            // Actualizar contadores
            totalAlumnos.textContent = data.totalAlumnos || 0;
            totalDocentes.textContent = data.totalDocentes || 0;
            totalPrimaria.textContent = data.totalPrimaria || 0;
            totalSecundaria.textContent = data.totalSecundaria || 0;
            
        } catch (error) {
            console.error('Error:', error);
            // Mostrar mensaje de error si es necesario
        }
    }
    
    /**
     * Carga la lista de usuarios según los filtros aplicados
     */
    async function cargarUsuarios() {
        try {
            // Mostrar loader
            usuariosLista.innerHTML = '<tr><td colspan="8"><div class="loader">Cargando usuarios...</div></td></tr>';
            
            // Construir URL con parámetros
            let url = `/api/perfiles?pagina=${paginaActual}`;
            
            // Añadir filtros si existen
            if (filtros.tipo) url += `&tipo=${encodeURIComponent(filtros.tipo)}`;
            if (filtros.nivel) url += `&nivel=${encodeURIComponent(filtros.nivel)}`;
            if (filtros.grado) url += `&grado=${encodeURIComponent(filtros.grado)}`;
            if (filtros.turno) url += `&turno=${encodeURIComponent(filtros.turno)}`;
            if (filtros.busqueda) url += `&busqueda=${encodeURIComponent(filtros.busqueda)}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar usuarios');
            }
            
            const data = await response.json();
            
            // Vaciar contenedor
            usuariosLista.innerHTML = '';
            
            // Si no hay usuarios, mostrar mensaje
            if (!data.usuarios || data.usuarios.length === 0) {
                usuariosLista.innerHTML = '<tr><td colspan="8" class="no-results">No se encontraron usuarios con los criterios seleccionados.</td></tr>';
                paginacion.innerHTML = '';
                return;
            }
            
            // Renderizar usuarios
            data.usuarios.forEach(usuario => {
                const tr = document.createElement('tr');
                
                // Determinar nivel, grado y turno según el perfil
                let nivel = '-';
                let gradoGrupo = '-';
                let turno = '-';
                
                if (usuario.perfil) {
                    if (usuario.perfil.nivel_educativo) {
                        switch (usuario.perfil.nivel_educativo) {
                            case 'primaria':
                                nivel = 'Primaria';
                                break;
                            case 'secundaria_basica':
                                nivel = 'Secundaria Básica';
                                break;
                            case 'secundaria_tecnica':
                                nivel = 'Secundaria Técnica';
                                break;
                            default:
                                nivel = usuario.perfil.nivel_educativo;
                        }
                    }
                    
                    if (usuario.perfil.grado) {
                        gradoGrupo = `${usuario.perfil.grado}° ${usuario.perfil.grupo || ''}`;
                    }
                    
                    if (usuario.perfil.turno) {
                        switch (usuario.perfil.turno) {
                            case 'matutino':
                                turno = 'Matutino';
                                break;
                            case 'vespertino':
                                turno = 'Vespertino';
                                break;
                            case 'tiempo_completo':
                                turno = 'Tiempo Completo';
                                break;
                            default:
                                turno = usuario.perfil.turno;
                        }
                    }
                }
                
                // Determinar clase de estado
                let estadoClass = '';
                switch (usuario.estado) {
                    case 'activo':
                        estadoClass = 'status-active';
                        break;
                    case 'inactivo':
                        estadoClass = 'status-inactive';
                        break;
                    case 'suspendido':
                        estadoClass = 'status-suspended';
                        break;
                    default:
                        estadoClass = '';
                }
                
                tr.innerHTML = `
                    <td>${usuario.id}</td>
                    <td>${usuario.nombre} ${usuario.apellido}</td>
                    <td>${usuario.tipo_usuario.charAt(0).toUpperCase() + usuario.tipo_usuario.slice(1)}</td>
                    <td>${nivel}</td>
                    <td>${gradoGrupo}</td>
                    <td>${turno}</td>
                    <td><span class="status-badge ${estadoClass}">${usuario.estado}</span></td>
                    <td class="acciones">
                        <button class="btn btn-sm btn-secondary btn-editar" data-id="${usuario.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm ${usuario.estado === 'activo' ? 'btn-warning' : 'btn-success'} btn-toggle-estado" data-id="${usuario.id}" data-estado="${usuario.estado}">
                            <i class="fas fa-${usuario.estado === 'activo' ? 'ban' : 'check'}"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-eliminar" data-id="${usuario.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                
                usuariosLista.appendChild(tr);
            });
            
            // Configurar paginación
            configurarPaginacion(data.totalPaginas, data.paginaActual);
            
            // Agregar event listeners a los botones
            document.querySelectorAll('.btn-editar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const usuarioId = this.getAttribute('data-id');
                    editarUsuario(usuarioId);
                });
            });
            
            document.querySelectorAll('.btn-toggle-estado').forEach(btn => {
                btn.addEventListener('click', function() {
                    const usuarioId = this.getAttribute('data-id');
                    const estadoActual = this.getAttribute('data-estado');
                    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
                    cambiarEstadoUsuario(usuarioId, nuevoEstado);
                });
            });
            
            document.querySelectorAll('.btn-eliminar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const usuarioId = this.getAttribute('data-id');
                    eliminarUsuario(usuarioId);
                });
            });
            
        } catch (error) {
            console.error('Error:', error);
            usuariosLista.innerHTML = '<tr><td colspan="8" class="error-message">Error al cargar usuarios. Por favor, intenta nuevamente.</td></tr>';
        }
    }
    
    /**
     * Aplica los filtros ingresados por el usuario
     */
    function aplicarFiltros() {
        filtros.tipo = tipoUsuarioFiltro.value;
        filtros.nivel = nivelFiltro.value;
        filtros.grado = gradoFiltro.value;
        filtros.turno = turnoFiltro.value;
        filtros.busqueda = buscarTexto.value.trim();
        
        // Reiniciar paginación
        paginaActual = 1;
        
        // Cargar usuarios con los nuevos filtros
        cargarUsuarios();
    }
    
    /**
     * Configura la paginación según el total de páginas
     * @param {number} totalPaginas - Total de páginas
     * @param {number} paginaActual - Página actual
     */
    function configurarPaginacion(totalPaginas, paginaActual) {
        paginacion.innerHTML = '';
        
        if (totalPaginas <= 1) {
            return;
        }
        
        const paginacionDiv = document.createElement('div');
        paginacionDiv.classList.add('pagination');
        
        // Botón "Anterior"
        const btnAnterior = document.createElement('div');
        btnAnterior.classList.add('page-item');
        if (paginaActual === 1) btnAnterior.classList.add('disabled');
        btnAnterior.textContent = '«';
        btnAnterior.addEventListener('click', () => {
            if (paginaActual > 1) {
                cambiarPagina(paginaActual - 1);
            }
        });
        paginacionDiv.appendChild(btnAnterior);
        
        // Botones de número de página
        for (let i = 1; i <= totalPaginas; i++) {
            // Mostrar primera, última, y páginas alrededor de la actual
            if (i === 1 || i === totalPaginas || (i >= paginaActual - 2 && i <= paginaActual + 2)) {
                const btn = document.createElement('div');
                btn.classList.add('page-item');
                if (i === paginaActual) btn.classList.add('active');
                btn.textContent = i;
                btn.addEventListener('click', () => cambiarPagina(i));
                paginacionDiv.appendChild(btn);
            } else if (i === paginaActual - 3 || i === paginaActual + 3) {
                // Añadir puntos suspensivos
                const ellipsis = document.createElement('div');
                ellipsis.classList.add('page-item', 'disabled');
                ellipsis.textContent = '...';
                paginacionDiv.appendChild(ellipsis);
            }
        }
        
        // Botón "Siguiente"
        const btnSiguiente = document.createElement('div');
        btnSiguiente.classList.add('page-item');
        if (paginaActual === totalPaginas) btnSiguiente.classList.add('disabled');
        btnSiguiente.textContent = '»';
        btnSiguiente.addEventListener('click', () => {
            if (paginaActual < totalPaginas) {
                cambiarPagina(paginaActual + 1);
            }
        });
        paginacionDiv.appendChild(btnSiguiente);
        
        paginacion.appendChild(paginacionDiv);
    }
    
    /**
     * Cambia a la página especificada y actualiza los usuarios
     * @param {number} pagina - Número de página
     */
    function cambiarPagina(pagina) {
        paginaActual = pagina;
        cargarUsuarios();
        // Hacer scroll al inicio de la tabla
        document.querySelector('.usuarios-tabla').scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Actualiza las opciones del select de grado según el nivel seleccionado
     * @param {string} nivel - Nivel educativo seleccionado
     */
    function actualizarOpcionesGrado(nivel) {
        // Limpiar opciones actuales, manteniendo la opción por defecto
        gradoFiltro.innerHTML = '<option value="">Todos los grados</option>';
        
        // No hacer nada si no hay nivel seleccionado
        if (!nivel) return;
        
        // Determinar número máximo de grados según el nivel
        let maxGrado = 6; // Por defecto para primaria
        
        if (nivel === 'secundaria_basica' || nivel === 'secundaria_tecnica') {
            maxGrado = 3;
        }
        
        // Generar opciones
        for (let i = 1; i <= maxGrado; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i + '°';
            gradoFiltro.appendChild(option);
        }
    }
    
    /**
     * Abre el modal para crear un nuevo usuario
     */
    function abrirModalNuevoUsuario() {
        // Obtener el modal
        const modalUsuario = document.getElementById('modal-usuario');
        
        // Si no existe el modal, crearlo
        if (!modalUsuario) {
            console.error('Error: Modal de usuario no encontrado en el DOM');
            return;
        }
        
        // Actualizar título del modal
        const modalTitle = modalUsuario.querySelector('.modal-title');
        if (modalTitle) modalTitle.textContent = 'Crear Nuevo Usuario';
        
        // Limpiar formulario
        const form = modalUsuario.querySelector('form');
        if (form) form.reset();
        
        // Preparar el formulario para un nuevo usuario
        const usuarioIdInput = modalUsuario.querySelector('#usuario-id');
        if (usuarioIdInput) usuarioIdInput.value = '';
        
        // Mostrar el modal
        modalUsuario.classList.remove('hidden');
        
        // Configurar evento de guardado para crear
        const btnGuardar = modalUsuario.querySelector('.btn-guardar');
        if (btnGuardar) {
            btnGuardar.removeEventListener('click', guardarUsuario);
            btnGuardar.addEventListener('click', guardarUsuario);
        }
    }
    
    /**
     * Abre el modal para editar un usuario existente
     * @param {string} usuarioId - ID del usuario a editar
     */
    async function editarUsuario(usuarioId) {
        try {
            // Obtener datos del usuario
            const response = await fetch(`/api/usuarios/${usuarioId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar datos del usuario');
            }
            
            const usuario = await response.json();
            
            // Obtener el modal
            const modalUsuario = document.getElementById('modal-usuario');
            
            // Si no existe el modal, mostrar error
            if (!modalUsuario) {
                console.error('Error: Modal de usuario no encontrado en el DOM');
                return;
            }
            
            // Actualizar título del modal
            const modalTitle = modalUsuario.querySelector('.modal-title');
            if (modalTitle) modalTitle.textContent = 'Editar Usuario';
            
            // Llenar formulario con datos del usuario
            const form = modalUsuario.querySelector('form');
            if (form) {
                // Datos básicos del usuario
                const nombreInput = form.querySelector('#nombre');
                const apellidoInput = form.querySelector('#apellido');
                const emailInput = form.querySelector('#email');
                const tipoUsuarioSelect = form.querySelector('#tipo-usuario');
                const usuarioIdInput = form.querySelector('#usuario-id');
                
                if (nombreInput) nombreInput.value = usuario.nombre;
                if (apellidoInput) apellidoInput.value = usuario.apellido;
                if (emailInput) emailInput.value = usuario.email;
                if (tipoUsuarioSelect) tipoUsuarioSelect.value = usuario.tipo_usuario;
                if (usuarioIdInput) usuarioIdInput.value = usuario.id;
                
                // Si hay perfil, llenar los campos correspondientes
                if (usuario.perfil) {
                    const nivelSelect = form.querySelector('#nivel');
                    const gradoSelect = form.querySelector('#grado');
                    const grupoInput = form.querySelector('#grupo');
                    const turnoSelect = form.querySelector('#turno');
                    const matriculaInput = form.querySelector('#matricula');
                    const departamentoSelect = form.querySelector('#departamento');
                    const codigoEmpleadoInput = form.querySelector('#codigo-empleado');
                    
                    // Mostrar campos según tipo de usuario
                    mostrarCamposPerfil(usuario.tipo_usuario);
                    
                    // Llenar campos de alumno
                    if (usuario.tipo_usuario === 'alumno' && usuario.perfil.tipo_perfil === 'alumno') {
                        if (nivelSelect) nivelSelect.value = usuario.perfil.nivel_educativo || '';
                        
                        // Actualizar opciones de grado según nivel
                        if (nivelSelect && nivelSelect.value) {
                            actualizarOpcionesGradoForm(nivelSelect.value);
                            
                            if (gradoSelect) gradoSelect.value = usuario.perfil.grado || '';
                        }
                        
                        if (grupoInput) grupoInput.value = usuario.perfil.grupo || '';
                        if (turnoSelect) turnoSelect.value = usuario.perfil.turno || '';
                        if (matriculaInput) matriculaInput.value = usuario.perfil.matricula || '';
                    }
                    
                    // Llenar campos de docente
                    if (usuario.tipo_usuario === 'docente' && usuario.perfil.tipo_perfil === 'docente') {
                        if (departamentoSelect) departamentoSelect.value = usuario.perfil.departamento || '';
                        if (codigoEmpleadoInput) codigoEmpleadoInput.value = usuario.perfil.codigo_empleado || '';
                    }
                }
                
                // Configurar evento para el cambio de tipo de usuario
                const tipoUsuario = form.querySelector('#tipo-usuario');
                if (tipoUsuario) {
                    tipoUsuario.removeEventListener('change', cambiarTipoUsuario);
                    tipoUsuario.addEventListener('change', cambiarTipoUsuario);
                }
                
                // Configurar evento para el cambio de nivel
                const nivel = form.querySelector('#nivel');
                if (nivel) {
                    nivel.removeEventListener('change', cambiarNivel);
                    nivel.addEventListener('change', cambiarNivel);
                }
            }
            
            // Mostrar el modal
            modalUsuario.classList.remove('hidden');
            
            // Configurar evento de guardado para actualizar
            const btnGuardar = modalUsuario.querySelector('.btn-guardar');
            if (btnGuardar) {
                btnGuardar.removeEventListener('click', guardarUsuario);
                btnGuardar.addEventListener('click', guardarUsuario);
            }
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar datos del usuario', 'error');
        }
    }
    
    /**
     * Guarda los datos del usuario (crear o actualizar)
     * @param {Event} event - Evento click
     */
    async function guardarUsuario(event) {
        event.preventDefault();
        
        // Obtener el modal y formulario
        const modalUsuario = document.getElementById('modal-usuario');
        const form = modalUsuario.querySelector('form');
        
        if (!form) {
            console.error('Error: Formulario no encontrado');
            return;
        }
        
        // Validar formulario
        if (!validarFormularioUsuario(form)) {
            return;
        }
        
        // Recopilar datos del formulario
        const formData = new FormData(form);
        const usuarioData = Object.fromEntries(formData.entries());
        
        // Determinar si es creación o actualización
        const esActualizacion = usuarioData.usuarioId ? true : false;
        
        try {
            // Mostrar indicador de carga
            const btnGuardar = modalUsuario.querySelector('.btn-guardar');
            const originalText = btnGuardar.textContent;
            btnGuardar.disabled = true;
            btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            
            // Preparar datos para enviar (eliminar campos innecesarios según tipo de usuario)
            const tipoUsuario = usuarioData.tipoUsuario;
            
            // Eliminar el ID del usuario (para creación) o convertirlo a número (para actualización)
            if (esActualizacion) {
                usuarioData.id = parseInt(usuarioData.usuarioId);
            }
            delete usuarioData.usuarioId;
            
            // Eliminar campos específicos del perfil según el tipo de usuario
            if (tipoUsuario === 'alumno') {
                delete usuarioData.departamento;
                delete usuarioData.codigoEmpleado;
            } else if (tipoUsuario === 'docente') {
                delete usuarioData.nivel;
                delete usuarioData.grado;
                delete usuarioData.grupo;
                delete usuarioData.turno;
                delete usuarioData.matricula;
            } else {
                // Para administrador y bibliotecario, eliminar todos los campos de perfil
                delete usuarioData.nivel;
                delete usuarioData.grado;
                delete usuarioData.grupo;
                delete usuarioData.turno;
                delete usuarioData.matricula;
                delete usuarioData.departamento;
                delete usuarioData.codigoEmpleado;
            }
            
            // Enviar datos al servidor
            const url = esActualizacion ? `/api/usuarios/${usuarioData.id}` : '/api/usuarios';
            const method = esActualizacion ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(usuarioData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar usuario');
            }
            
            // Cerrar modal
            modalUsuario.classList.add('hidden');
            
            // Recargar datos
            cargarUsuarios();
            cargarEstadisticas();
            
            // Mostrar mensaje de éxito
            mostrarNotificacion(
                esActualizacion ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito',
                'success'
            );
            
        } catch (error) {
            console.error('Error:', error);
            
            // Mostrar mensaje de error
            const errorContainer = form.querySelector('.error-message') || document.createElement('div');
            errorContainer.classList.add('error-message');
            errorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
            
            if (!form.querySelector('.error-message')) {
                form.appendChild(errorContainer);
            }
            
        } finally {
            // Restaurar botón
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.textContent = originalText;
            }
        }
    }
    
    /**
     * Cambia el estado de un usuario
     * @param {string} usuarioId - ID del usuario
     * @param {string} nuevoEstado - Nuevo estado para el usuario ('activo', 'inactivo', 'suspendido')
     */
    async function cambiarEstadoUsuario(usuarioId, nuevoEstado) {
        try {
            // Pedir confirmación al usuario
            if (!confirm(`¿Estás seguro de que deseas cambiar el estado del usuario a "${nuevoEstado}"?`)) {
                return;
            }
            
            // Enviar solicitud al servidor
            const response = await fetch(`/api/usuarios/${usuarioId}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cambiar el estado del usuario');
            }
            
            // Recargar usuarios
            cargarUsuarios();
            
            // Mostrar mensaje de éxito
            mostrarNotificacion(`Estado del usuario cambiado a "${nuevoEstado}" exitosamente`);
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message || 'Error al cambiar el estado del usuario', 'error');
        }
    }
    
    /**
     * Elimina un usuario
     * @param {string} usuarioId - ID del usuario a eliminar
     */
    async function eliminarUsuario(usuarioId) {
        try {
            // Pedir confirmación al usuario
            if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
                return;
            }
            
            // Enviar solicitud al servidor
            const response = await fetch(`/api/usuarios/${usuarioId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el usuario');
            }
            
            // Recargar usuarios
            cargarUsuarios();
            cargarEstadisticas();
            
            // Mostrar mensaje de éxito
            mostrarNotificacion('Usuario eliminado exitosamente');
            
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message || 'Error al eliminar el usuario', 'error');
        }
    }
    
    /**
     * Abre el modal para importar usuarios
     */
    function abrirModalImportarUsuarios() {
        // Aquí iría la lógica para abrir un modal de importación
        // Por ejemplo, redireccionar a una página de importación
        window.location.href = '/importar-usuarios.html';
    }
    
    /**
     * Muestra u oculta campos de perfil según el tipo de usuario seleccionado
     * @param {string} tipoUsuario - Tipo de usuario seleccionado
     */
    function mostrarCamposPerfil(tipoUsuario) {
        const modalUsuario = document.getElementById('modal-usuario');
        const camposAlumno = modalUsuario.querySelector('.campos-alumno');
        const camposDocente = modalUsuario.querySelector('.campos-docente');
        
        if (camposAlumno) camposAlumno.classList.add('hidden');
        if (camposDocente) camposDocente.classList.add('hidden');
        
        if (tipoUsuario === 'alumno' && camposAlumno) {
            camposAlumno.classList.remove('hidden');
        } else if (tipoUsuario === 'docente' && camposDocente) {
            camposDocente.classList.remove('hidden');
        }
    }
    
    /**
     * Maneja el cambio de tipo de usuario en el formulario
     * @param {Event} event - Evento de cambio
     */
    function cambiarTipoUsuario(event) {
        const tipoUsuario = event.target.value;
        mostrarCamposPerfil(tipoUsuario);
    }
    
    /**
     * Maneja el cambio de nivel educativo en el formulario
     * @param {Event} event - Evento de cambio
     */
    function cambiarNivel(event) {
        const nivel = event.target.value;
        actualizarOpcionesGradoForm(nivel);
    }
    
    /**
     * Actualiza las opciones del select de grado en el formulario según el nivel seleccionado
     * @param {string} nivel - Nivel educativo seleccionado
     */
    function actualizarOpcionesGradoForm(nivel) {
        const modalUsuario = document.getElementById('modal-usuario');
        const gradoSelect = modalUsuario.querySelector('#grado');
        
        if (!gradoSelect) return;
        
        // Limpiar opciones actuales, manteniendo la opción por defecto
        gradoSelect.innerHTML = '<option value="" disabled selected>Selecciona grado</option>';
        
        // No hacer nada si no hay nivel seleccionado
        if (!nivel) return;
        
        // Determinar número máximo de grados según el nivel
        let maxGrado = 6; // Por defecto para primaria
        
        if (nivel === 'secundaria_basica' || nivel === 'secundaria_tecnica') {
            maxGrado = 3;
        }
        
        // Generar opciones
        for (let i = 1; i <= maxGrado; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i + '°';
            gradoSelect.appendChild(option);
        }
    }
    
    /**
     * Valida los campos del formulario de usuario
     * @param {HTMLFormElement} form - Formulario a validar
     * @returns {boolean} - Resultado de la validación
     */
    function validarFormularioUsuario(form) {
        const nombre = form.querySelector('#nombre').value.trim();
        const apellido = form.querySelector('#apellido').value.trim();
        const email = form.querySelector('#email').value.trim();
        const tipoUsuario = form.querySelector('#tipo-usuario').value;
        
        // Validar campos básicos
        if (!nombre || !apellido || !email || !tipoUsuario) {
            mostrarErrorFormulario(form, 'Todos los campos marcados con * son obligatorios');
            return false;
        }
        
        // Validar formato de email
        if (!validarEmail(email)) {
            mostrarErrorFormulario(form, 'El formato del correo electrónico no es válido');
            return false;
        }
        
        // Validar campos específicos según tipo de usuario
        if (tipoUsuario === 'alumno') {
            const nivel = form.querySelector('#nivel').value;
            const grado = form.querySelector('#grado').value;
            
            if (!nivel || !grado) {
                mostrarErrorFormulario(form, 'El nivel y grado son obligatorios para alumnos');
                return false;
            }
        } else if (tipoUsuario === 'docente') {
            const departamento = form.querySelector('#departamento').value;
            
            if (!departamento) {
                mostrarErrorFormulario(form, 'El departamento es obligatorio para docentes');
                return false;
            }
        }
        
        // Si hay un campo de contraseña y tiene valor, validar su formato
        const password = form.querySelector('#password');
        if (password && password.value) {
            if (password.value.length < 8) {
                mostrarErrorFormulario(form, 'La contraseña debe tener al menos 8 caracteres');
                return false;
            }
        }
        
        // Eliminar mensaje de error si existe
        const errorContainer = form.querySelector('.error-message');
        if (errorContainer) errorContainer.remove();
        
        return true;
    }
    
    /**
     * Muestra un mensaje de error en el formulario
     * @param {HTMLFormElement} form - Formulario donde mostrar el error
     * @param {string} mensaje - Mensaje de error a mostrar
     */
    function mostrarErrorFormulario(form, mensaje) {
        // Buscar o crear contenedor de error
        let errorContainer = form.querySelector('.error-message');
        
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.classList.add('error-message');
            form.appendChild(errorContainer);
        }
        
        // Mostrar mensaje
        errorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
        
        // Hacer scroll al mensaje de error
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    /**
     * Valida el formato de un email
     * @param {string} email - Email a validar
     * @returns {boolean} - Resultado de la validación
     */
    function validarEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
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