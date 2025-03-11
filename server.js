// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

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

// Sincronizar con la base de datos
db.sequelize.sync({ force: false }) // Cambiado de alter: true a force: false
  .then(() => {
    console.log('Base de datos sincronizada');
  })
  .catch(err => {
    console.error('Error al sincronizar la base de datos:', err);
    console.log('La aplicación continuará funcionando sin la sincronización completa');
  });

// Rutas API
const apiRoutes = require('./routes/api.routes');
app.use('/api', apiRoutes);

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

// Ruta de captura para 404
app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});