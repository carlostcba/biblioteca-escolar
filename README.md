# Biblioteca Escolar

Sistema de gestión para biblioteca escolar desarrollado con Node.js y SQL Server 2022 Express. La aplicación permite administrar el catálogo de libros, préstamos, reservas y usuarios con diferentes roles y permisos.

## Características principales

- Gestión de catálogo de libros con información bibliográfica completa
- Administración de ejemplares físicos de cada libro
- Gestión de préstamos y devoluciones
- Sistema de reservas de libros
- Perfiles de usuarios diferenciados (administradores, bibliotecarios, docentes, alumnos)
- Panel de administración con estadísticas y reportes
- Control de acceso basado en roles (RBAC)
- Interfaz web responsiva y amigable

## Tecnologías utilizadas

- **Backend**: Node.js, Express.js
- **Base de datos**: Microsoft SQL Server 2022 Express
- **ORM**: Sequelize
- **Frontend**: HTML, CSS, JavaScript
- **Autenticación**: JWT (JSON Web Tokens)

## Estructura del proyecto

```
├── config/               # Configuraciones (BD, autenticación, RBAC)
├── controllers/          # Controladores de la aplicación
├── middlewares/          # Middleware (autenticación, validación)
├── models/               # Modelos Sequelize para SQL Server
├── public/               # Archivos estáticos (CSS, JS, imágenes)
├── routes/               # Rutas de la API
├── seeders/              # Datos iniciales para la BD
├── utils/                # Utilidades y helpers
├── views/                # Archivos HTML para la interfaz de usuario
├── server.js             # Punto de entrada de la aplicación
└── package.json          # Dependencias y scripts
```

## Estado actual del desarrollo

El proyecto se encuentra en fase de desarrollo con las siguientes funcionalidades implementadas:

- ✅ Estructura básica del proyecto
- ✅ Modelos de datos para entidades principales (usuario, libro, ejemplar, préstamo, reserva)
- ✅ Sistema de autenticación con JWT
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Vistas HTML para la interfaz de usuario
- ✅ APIs para gestión del catálogo
- ✅ Funcionalidad de importación de libros por CSV
- ✅ Interfaz del catálogo y detalles de libros

## Funcionalidades pendientes

- ❌ Generación de reportes avanzados
- ❌ Notificaciones por correo electrónico
- ❌ Integración con sistemas escolares externos
- ❌ Funcionalidad de escaneo de códigos de barras para préstamos
- ❌ Aplicación móvil para usuarios
- ❌ Panel de estadísticas avanzadas

## Requisitos previos

Para ejecutar el proyecto, necesitarás:

1. Node.js (v14.x o superior)
2. Microsoft SQL Server 2022 Express
3. NPM (incluido con Node.js)

## Instalación y configuración

### Preparación de la base de datos

1. Instala Microsoft SQL Server 2022 Express
2. Crea una nueva base de datos llamada `BibliotecaEscolar`
3. Ejecuta el script SQL ubicado en `database-setup.sql` para crear las tablas necesarias

### Configuración del proyecto

1. Clona este repositorio
```bash
git clone https://github.com/carlostcba/biblioteca-escolar.git
cd biblioteca-escolar
```

2. Instala las dependencias
```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
```
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de la base de datos
DB_HOST=localhost
DB_USER=sa
DB_PASSWORD=TuContraseñaAquí
DB_NAME=BibliotecaEscolar
DB_DIALECT=mssql

# Configuración JWT
JWT_SECRET=tu_clave_secreta_para_jwt
JWT_EXPIRATION=86400
```

4. Ejecuta los seeders para crear datos iniciales
```bash
npm run seed
```

5. Inicia el servidor
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

- **[## Guia para despliegue en Docker](./docker-guide.md)**

## Roles y permisos

El sistema implementa los siguientes roles:

- **Administrador**: Acceso completo al sistema
- **Bibliotecario**: Gestión del catálogo y préstamos
- **Docente**: Búsqueda, préstamos especiales, reservas
- **Alumno**: Búsqueda y reservas según nivel educativo

## Puesta en producción

Para desplegar la aplicación en un entorno de producción, sigue estos pasos:

### Requisitos para producción

- Servidor con Windows Server o Linux
- Node.js (v14.x o superior)
- Microsoft SQL Server 2022 (Express o Standard)
- Servidor web (opcional, para proxy inverso): Nginx o IIS

### Pasos para el despliegue

1. Prepara la base de datos:
   - Configura SQL Server con autenticación mixta
   - Crea un usuario específico para la aplicación con permisos limitados
   - Ejecuta el script `database-setup.sql`

2. Configura el entorno:
   - Clona el repositorio en el servidor
   - Instala las dependencias: `npm install --production`
   - Crea un archivo `.env` con la configuración de producción
   - Modifica `NODE_ENV=production` en el archivo `.env`
   - Asegúrate de usar una clave JWT_SECRET fuerte y única

3. Configura un proceso de gestión:
   - Instala PM2: `npm install -g pm2`
   - Inicia la aplicación: `pm2 start server.js --name biblioteca-escolar`
   - Configura el inicio automático: `pm2 startup` y sigue las instrucciones
   - Guarda la configuración: `pm2 save`

4. Configura un proxy inverso (opcional pero recomendado):
   
   **Para Nginx:**
   ```
   server {
       listen 80;
       server_name biblioteca.tuescuela.edu;
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   **Para IIS:**
   - Instala el módulo URL Rewrite
   - Configura una regla de reenvío al puerto local 3000

5. Configura HTTPS:
   - Obtén un certificado SSL (Let's Encrypt o similar)
   - Configura el certificado en tu servidor web

## Mantenimiento

### Copias de seguridad

Programa copias de seguridad regulares de la base de datos:

```sql
BACKUP DATABASE BibliotecaEscolar 
TO DISK = 'C:\Backups\BibliotecaEscolar_Full.bak'
WITH FORMAT, COMPRESSION, STATS = 10;
```

### Actualizaciones

Para actualizar la aplicación:

1. Detén el servicio: `pm2 stop biblioteca-escolar`
2. Actualiza el código: `git pull`
3. Instala dependencias: `npm install --production`
4. Reinicia el servicio: `pm2 restart biblioteca-escolar`

## Solución de problemas comunes

- **Error de conexión a la base de datos**: Verifica que SQL Server esté en ejecución y las credenciales sean correctas
- **Error de autenticación**: Asegúrate de que JWT_SECRET coincida con el valor usado durante la generación de tokens
- **Problemas de permisos**: Verifica que el usuario de SQL Server tenga los permisos adecuados
- **Problemas de rendimiento**: Considera ajustar la configuración de pool de conexiones en `config/db.config.js`

## Contribuciones

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz un fork del repositorio
2. Crea una rama para tu función: `git checkout -b nueva-funcion`
3. Realiza tus cambios y haz commit: `git commit -m 'Añadir nueva función'`
4. Envía tus cambios: `git push origin nueva-funcion`
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia ISC.

## Contacto

Para soporte o preguntas, contacta a [tu@email.com]().
