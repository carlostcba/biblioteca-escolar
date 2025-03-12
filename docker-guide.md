# Dockerización de Biblioteca Escolar

## Requisitos Previos

- Docker
- Docker Compose
- Git

## Estructura de Archivos

Vamos a crear los siguientes archivos en la raíz del proyecto:

### 1. Dockerfile (Para la aplicación Node.js)

```dockerfile
# Usar imagen oficial de Node.js
FROM node:16-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Exponer puerto de la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
```

### 2. Dockerfile-mssql (Para SQL Server)

```dockerfile
# Usar imagen oficial de Microsoft SQL Server
FROM mcr.microsoft.com/mssql/server:2022-latest

# Argumentos para configuración
ARG SA_PASSWORD=LaSalle2599!
ARG ACCEPT_EULA=Y

# Variables de entorno
ENV SA_PASSWORD=${SA_PASSWORD}
ENV ACCEPT_EULA=${ACCEPT_EULA}

# Exponer puerto de SQL Server
EXPOSE 1433

# Configuraciones adicionales pueden ir aquí
```

### 3. docker-compose.yml

```yaml
version: '3.8'

services:
  # Servicio de base de datos
  db:
    build: 
      context: .
      dockerfile: Dockerfile-mssql
    container_name: biblioteca-db
    environment:
      - SA_PASSWORD=LaSalle2599!
      - ACCEPT_EULA=Y
    ports:
      - "1433:1433"
    volumes:
      - mssql-data:/var/opt/mssql/data
      - ./database-setup.sql:/docker-entrypoint-initdb.d/database-setup.sql
    networks:
      - biblioteca-network

  # Servicio de aplicación Node.js
  app:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: biblioteca-app
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_USER=sa
      - DB_PASSWORD=LaSalle2599!
      - DB_NAME=BibliotecaEscolar
      - DB_DIALECT=mssql
      - JWT_SECRET=tu_clave_secreta_muy_segura
    ports:
      - "3000:3000"
    depends_on:
      - db
    networks:
      - biblioteca-network
    volumes:
      - ./:/app
      - /app/node_modules

# Volúmenes para persistencia de datos
volumes:
  mssql-data:

# Red para comunicación entre servicios  
networks:
  biblioteca-network:
    driver: bridge
```

### 4. .dockerignore

```
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
.env
logs
*.log
```

### 5. Preparación del proyecto

#### Modificar package.json

Actualizar scripts para producción:

```json
{
  "scripts": {
    "start": "node server.js",
    "start:dev": "nodemon server.js",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  }
}
```

### Guía de Uso

#### Construcción y Ejecución

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Consideraciones de Seguridad

1. Nunca commit secretos o contraseñas en el repositorio
2. Usar variables de entorno
3. Modificar las contraseñas predeterminadas

### Configuración de Desarrollo vs Producción

#### Desarrollo
- Usar `docker-compose.yml`
- Habilitar recarga en caliente
- Mapear puertos locales

#### Producción
- Crear `docker-compose.prod.yml`
- Deshabilitar puertos públicos
- Usar volúmenes seguros
- Configurar reinicio automático

### Troubleshooting

#### Problemas comunes

1. **Error de conexión a la base de datos**
   - Verificar credenciales
   - Comprobar configuración de red
   - Revisar variables de entorno

2. **Problemas de permisos**
   ```bash
   # Dar permisos si es necesario
   sudo chown -R 1000:1000 ./data
   ```

3. **Reiniciar servicios**
   ```bash
   docker-compose restart app
   docker-compose restart db
   ```

### Mejores Prácticas

- Usar secretos de Docker para credenciales
- Implementar healthchecks
- Configurar límites de recursos
- Mantener imágenes actualizadas

### Despliegue en Producción

1. Configurar un orquestador como Kubernetes
2. Implementar CI/CD
3. Usar un registro de contenedores privado
4. Configurar monitoreo y logs

## Licencia

Proyecto bajo Licencia ISC
```

Características principales de esta guía de dockerización:

1. Dockerfiles separados para la aplicación y la base de datos
2. Docker Compose para orquestación
3. Configuración de red y volúmenes
4. Guía de uso y troubleshooting
5. Consideraciones de seguridad
6. Diferenciación entre desarrollo y producción

¿Te gustaría que realice algún ajuste o añada alguna sección adicional?