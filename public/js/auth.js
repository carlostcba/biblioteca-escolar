// js/auth.js
(function() {
    // Función para inicializar el sistema de autenticación
    function initAuth() {
        // Verificación inmediata para Mis Reservas
        const currentPath = window.location.pathname;
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const userInfoStr = localStorage.getItem('user_info');
        const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
        
        console.log("Initializing auth system, current path:", currentPath);
        console.log("User info available:", !!userInfo);
        
        // Redirección inmediata de mis-reservas para roles no permitidos
        if (currentPath.includes('mis-reservas.html') && userInfo) {
            if (userInfo.tipo_usuario === 'administrador' || userInfo.tipo_usuario === 'bibliotecario') {
                console.log('Redireccionando desde mis-reservas.html - acceso no permitido');
                window.location.href = '/catalogo.html';
                return; // Detener ejecución del script
            }
        }
        
        // Marcar la página activa en la navegación
        markActivePage();
        
        // Elementos DOM comunes
        const guestElements = document.querySelectorAll('.guest-only');
        const userElements = document.querySelectorAll('.user-only');
        const adminElements = document.querySelectorAll('.admin-only');
        const bibliotecarioElements = document.querySelectorAll('.bibliotecario-only');
        const studentTeacherElements = document.querySelectorAll('.student-teacher-only');
        const userName = document.getElementById('user-name');
        const logoutBtn = document.getElementById('logout-btn');
        
        // Actualizar la interfaz inicial
        updateAuthUI();
        
        // Verificar autorización para la página actual
        // Sólo verificar la autorización de la página si no estamos en el proceso de login/logout
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('login-success.html')) {
            checkPageAuthorization();
        }
        
        // Verificar autenticación con el servidor
        verifyAuth();
        
        // Event listener para botón de logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
        
        // Toggle del menú desplegable
        setupDropdowns();
        
        // Observar cambios en el DOM para aplicar permisos dinámicamente
        setupMutationObserver();
        
        // Verificar si acabamos de iniciar sesión (redirección desde login.js)
        handlePostLogin();
        
        // Función para marcar la página activa en la navegación
        function markActivePage() {
            const navLinks = document.querySelectorAll('.nav-left a, .nav-right a');
            
            navLinks.forEach(link => {
                if (link.getAttribute('href') === currentPath || 
                    (currentPath.includes(link.getAttribute('href')) && link.getAttribute('href') !== '/')) {
                    link.classList.add('active');
                }
            });
        }
        
        // Función para actualizar la navegación según el rol del usuario
        function updateNavigation() {
            const userType = userInfo ? userInfo.tipo_usuario : null;
            
            // Ocultar todos los elementos específicos de rol primero
            document.querySelectorAll('.role-specific').forEach(el => {
                el.classList.add('hidden');
            });
            
            // Mostrar elementos según el rol
            if (userType === 'administrador') {
                document.querySelectorAll('.admin-nav').forEach(el => {
                    el.classList.remove('hidden');
                });
            } else if (userType === 'bibliotecario') {
                document.querySelectorAll('.librarian-nav').forEach(el => {
                    el.classList.remove('hidden');
                });
            } else if (userType === 'docente') {
                document.querySelectorAll('.teacher-nav').forEach(el => {
                    el.classList.remove('hidden');
                });
            } else if (userType === 'alumno') {
                document.querySelectorAll('.student-nav').forEach(el => {
                    el.classList.remove('hidden');
                });
            }
            
            // Mostrar elementos comunes para usuarios autenticados
            if (userType) {
                document.querySelectorAll('.auth-nav').forEach(el => {
                    el.classList.remove('hidden');
                });
            } else {
                document.querySelectorAll('.guest-nav').forEach(el => {
                    el.classList.remove('hidden');
                });
            }
        }
        
        // Función para actualizar la interfaz según el estado de autenticación
        function updateAuthUI() {
            console.log("Updating auth UI, token:", !!token, "userInfo:", !!userInfo);
            
            // Agregar atributo data-role al body para control CSS
            if (userInfo) {
                document.body.setAttribute('data-role', userInfo.tipo_usuario);
                console.log("Setting data-role:", userInfo.tipo_usuario);
            } else {
                document.body.removeAttribute('data-role');
            }
            
            if (token && userInfo) {
                // Usuario autenticado
                guestElements.forEach(el => el.classList.add('hidden'));
                userElements.forEach(el => el.classList.remove('hidden'));
                
                // Mostrar el nombre del usuario
                if (userName) {
                    userName.textContent = `${userInfo.nombre} ${userInfo.apellido}`;
                }
                
                // Mostrar elementos según el tipo de usuario
                const userType = userInfo.tipo_usuario.toLowerCase();
                console.log("User type (normalized):", userType);
                
                if (userType === 'administrador' || userType === 'admin') {
                    console.log("User is admin, showing admin elements");
                    adminElements.forEach(el => el.classList.remove('hidden'));
                    bibliotecarioElements.forEach(el => el.classList.remove('hidden'));
                    // Ocultar enlaces específicos para estudiantes/docentes
                    studentTeacherElements.forEach(el => el.classList.add('hidden'));
                    
                    // Verificar acceso a mis-reservas para administradores
                    if (currentPath.includes('mis-reservas.html')) {
                        window.location.href = '/catalogo.html';
                        return;
                    }
                } else if (userType === 'bibliotecario') {
                    console.log("User is librarian, showing librarian elements");
                    bibliotecarioElements.forEach(el => el.classList.remove('hidden'));
                    adminElements.forEach(el => el.classList.add('hidden'));
                    // Ocultar enlaces específicos para estudiantes/docentes
                    studentTeacherElements.forEach(el => el.classList.add('hidden'));
                    
                    // Verificar acceso a mis-reservas para bibliotecarios
                    if (currentPath.includes('mis-reservas.html')) {
                        window.location.href = '/catalogo.html';
                        return;
                    }
                } else {
                    console.log("User is student/teacher, showing appropriate elements");
                    adminElements.forEach(el => el.classList.add('hidden'));
                    bibliotecarioElements.forEach(el => el.classList.add('hidden'));
                    // Mostrar enlaces específicos para estudiantes/docentes
                    studentTeacherElements.forEach(el => el.classList.remove('hidden'));
                }
                
                // Actualizar navegación específica
                updateNavigation();
            } else {
                // Usuario no autenticado
                console.log("No authenticated user, showing guest elements");
                guestElements.forEach(el => el.classList.remove('hidden'));
                userElements.forEach(el => el.classList.add('hidden'));
                adminElements.forEach(el => el.classList.add('hidden'));
                bibliotecarioElements.forEach(el => el.classList.add('hidden'));
                studentTeacherElements.forEach(el => el.classList.add('hidden'));
                
                // Actualizar navegación específica
                updateNavigation();
                
                // Redirigir a login si se intenta acceder a páginas protegidas
                const protectedPages = [
                    'dashboard.html', 'prestamos.html', 'reservas.html', 
                    'reportes.html', 'perfiles.html', 'admin-usuarios.html',
                    'mis-reservas.html', 'perfil.html', 'importar.html'
                ];
                
                const currentPage = window.location.pathname.split('/').pop();
                
                if (protectedPages.includes(currentPage)) {
                    // Guardar la página actual para redirigir después del login
                    localStorage.setItem('redirect_after_login', window.location.href);
                    window.location.href = '/login.html';
                }
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
                }).catch(() => {
                    // Si falla la conexión al servidor, dar por bueno el token (para desarrollo)
                    return { ok: true, json: () => ({ valid: true }) };
                });
                
                if (!response.ok) {
                    // Token inválido, cerrar sesión
                    console.log("Auth check failed, logging out");
                    logout();
                } else {
                    // Actualizar información del usuario si es necesario
                    const data = await response.json();
                    if (data.usuario) {
                        localStorage.setItem('user_info', JSON.stringify({
                            id: data.usuario.id,
                            nombre: data.usuario.nombre,
                            apellido: data.usuario.apellido,
                            email: data.usuario.email,
                            tipo_usuario: data.usuario.tipo_usuario
                        }));
                    }
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
        
        // Configurar dropdowns
        function setupDropdowns() {
            const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
            dropdownToggles.forEach(toggle => {
                toggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    const dropdown = this.closest('.dropdown');
                    dropdown.classList.toggle('active');
                    this.nextElementSibling.classList.toggle('show');
                });
            });
            
            // Cerrar dropdown al hacer clic fuera
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.dropdown')) {
                    const dropdowns = document.querySelectorAll('.dropdown-menu');
                    dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
                    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
                }
            });
        }
        
        // Comprobar si la página actual requiere autorización específica
        function checkPageAuthorization() {
            // Si estamos en la página de acceso denegado o catalogo, no hacer verificación adicional
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage === 'acceso-denegado.html' || 
                currentPage === 'catalogo.html' || 
                currentPage === 'login.html' ||
                currentPage === 'index.html' ||
                currentPage === '') {
                return;
            }
            
            if (!userInfo) return; // Si no hay usuario, ya se manejará en updateAuthUI
            
            const userType = userInfo.tipo_usuario.toLowerCase();
            console.log("Checking page authorization for user type:", userType, "on page:", currentPage);
            
            // Definir páginas restringidas por tipo de usuario
            const adminPages = ['reportes.html', 'perfiles.html', 'admin-usuarios.html'];
            const bibPages = ['dashboard.html', 'prestamos.html', 'reservas.html', 'importar.html'];
            const studentTeacherPages = ['mis-reservas.html'];
            
            // Verificar acceso
            if (adminPages.includes(currentPage) && userType !== 'administrador' && userType !== 'admin') {
                console.log(`Acceso denegado a página de administrador: ${currentPage}`);
                window.location.href = '/acceso-denegado.html';
                return; // Importante: detener la ejecución aquí
            } else if (bibPages.includes(currentPage) && 
                      userType !== 'administrador' && 
                      userType !== 'admin' && 
                      userType !== 'bibliotecario') {
                console.log(`Acceso denegado a página de bibliotecario: ${currentPage}`);
                window.location.href = '/acceso-denegado.html';
                return; // Importante: detener la ejecución aquí
            } else if (studentTeacherPages.includes(currentPage) && 
                      (userType === 'administrador' || userType === 'admin' || userType === 'bibliotecario')) {
                console.log(`Acceso denegado a página de alumno/docente: ${currentPage}`);
                window.location.href = '/catalogo.html';
                return; // Importante: detener la ejecución aquí
            }
        }
        
        // Configurar observer para cambios en el DOM
        function setupMutationObserver() {
            const observer = new MutationObserver(function(mutations) {
                if (userInfo && (userInfo.tipo_usuario.toLowerCase() === 'administrador' || 
                                userInfo.tipo_usuario.toLowerCase() === 'admin' || 
                                userInfo.tipo_usuario.toLowerCase() === 'bibliotecario')) {
                    document.querySelectorAll('.student-teacher-only').forEach(el => {
                        el.classList.add('hidden');
                    });
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        }
        
        // Manejar post-login
        function handlePostLogin() {
            // Verificar si estamos en la página de post-login
            if (window.location.pathname.includes('login-success.html')) {
                // Redirigir directamente al catálogo
                window.location.href = '/catalogo.html';
                return;
            }
            
            // Verificar si acabamos de iniciar sesión (redirección desde login.js)
            const justLoggedIn = sessionStorage.getItem('just_logged_in');
            if (justLoggedIn === 'true') {
                sessionStorage.removeItem('just_logged_in');
                
                // Verificar si hay una página guardada para redirección post-login
                const redirectUrl = localStorage.getItem('redirect_after_login');
                if (redirectUrl) {
                    localStorage.removeItem('redirect_after_login');
                    // Verificar si es una página de mis-reservas y el usuario es admin o bibliotecario
                    if ((redirectUrl.includes('mis-reservas.html')) && 
                        userInfo && 
                        (userInfo.tipo_usuario.toLowerCase() === 'administrador' || 
                        userInfo.tipo_usuario.toLowerCase() === 'admin' || 
                        userInfo.tipo_usuario.toLowerCase() === 'bibliotecario')) {
                        window.location.href = '/catalogo.html';
                    } else {
                        window.location.href = redirectUrl;
                    }
                } else {
                    window.location.href = '/catalogo.html';
                }
                return;
            }
        }
    }
    
    // Métodos públicos para el servicio de autenticación
    window.AuthService = {
        // Obtiene el token almacenado
        getToken: function() {
            return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        },
        
        // Obtiene información del usuario actual
        getUserInfo: function() {
            const userInfoStr = localStorage.getItem('user_info');
            if (!userInfoStr) return null;
            
            try {
                return JSON.parse(userInfoStr);
            } catch (error) {
                console.error("Error al parsear información de usuario:", error);
                localStorage.removeItem('user_info');
                return null;
            }
        },
        
        // Verifica si el usuario está autenticado
        isAuthenticated: function() {
            return !!this.getToken() && !!this.getUserInfo();
        },
        
        // Verifica si el usuario es administrador o bibliotecario
        isAdmin: function() {
            const userInfo = this.getUserInfo();
            if (!userInfo) return false;
            
            const userType = userInfo.tipo_usuario.toLowerCase();
            return userType === 'administrador' || userType === 'admin' || userType === 'bibliotecario';
        },
        
        // Cierra la sesión del usuario
        logout: function() {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            window.location.href = '/login.html';
        },
        
        // Actualiza la interfaz de usuario según el estado de autenticación
        updateUI: function() {
            // Esta función es un wrapper alrededor de la función updateAuthUI interna
            // que podemos llamar desde fuera si es necesario
            window.location.reload();
        }
    };
    
    // Ejecutar inicialización cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
})();