// config/db.config.js
require('dotenv').config();

module.exports = {
  dialect: process.env.DB_DIALECT || '',
  host: process.env.DB_HOST || '',
  username: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || '',
  dialectOptions: {
    options: {
      encrypt: false,  // No usar cifrado
      trustServerCertificate: false, // No confiar en certificados
      instanceName: process.env.DB_INSTANCE || '',
      connectTimeout: 60000,
      requestTimeout: 60000
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
};