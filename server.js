// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const runSeeders = require('./seeders'); // Importar seeders

// Inicializar Express
const app = express();

// Configuración de middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views'))); // Agregado para servir HTML de 'views'

// Conexión a la base de datos
const db = require('./models');

// Rutas API
const apiRoutes = require('./routes/api.routes');
app.use('/api', apiRoutes);

// Rutas de autenticación
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Rutas para las vistas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Agregar rutas específicas para otros HTML
app.get('/catalogo', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'catalogo.html'));
});

app.get('/importar', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'importar.html'));
});

// Rutas para la gestión de usuarios
const usuarioRoutes = require('./routes/usuario.routes');
app.use('/api/usuarios', usuarioRoutes);

// Agregar rutas para autenticación
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'registro.html'));
});

// Ruta de captura para 404
app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

// Iniciar servidor después de sincronizar BD y ejecutar seeders
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Sincronizar con la base de datos
    await db.sequelize.sync({ force: false });
    console.log('Base de datos sincronizada');
    
    // Verificar si el modelo Rol existe y si hay roles
    let needsSeeding = false;
    
    try {
      if (db.Rol) {
        const rolesCount = await db.Rol.count();
        needsSeeding = rolesCount === 0;
        
        if (needsSeeding) {
          console.log('No se encontraron roles. Ejecutando seeders...');
        } else {
          console.log('Los datos iniciales ya existen en la base de datos');
        }
      } else {
        console.log('El modelo Rol no está definido. Ejecutando seeders...');
        needsSeeding = true;
      }
    } catch (error) {
      console.log('Error al verificar roles. Ejecutando seeders por seguridad...', error);
      needsSeeding = true;
    }
    
    // Ejecutar seeders si es necesario
    if (needsSeeding) {
      try {
        await runSeeders();
        console.log('Datos iniciales creados correctamente');
      } catch (seedError) {
        console.error('Error durante la ejecución de seeders:', seedError);
        // Continuamos a pesar del error en los seeders
      }
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    
    // Iniciar el servidor de todos modos para permitir la funcionalidad parcial
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en puerto ${PORT} (modo degradado)`);
    });
  }
}

// Iniciar el servidor
startServer();