// config/db.config.js
require('dotenv').config();

module.exports = {
  dialect: 'mssql',
  host: 'localhost',
  username: 'sa',
  password: 'LaSalle2599',
  database: 'BibliotecaEscolar',
  dialectOptions: {
    options: {
      encrypt: false,  // No usar cifrado
      trustServerCertificate: false, // No confiar en certificados
      instanceName: 'SQLEXPRESS',
      connectTimeout: 30000
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: console.log
};