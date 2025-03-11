// config/db.config.js
require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'BibliotecaEscolar',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  dialect: 'mssql',
  options: {
    trustServerCertificate: true, // Cambiar a false en producción
    enableArithAbort: true,
    instanceName: 'SQLEXPRESS'
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};