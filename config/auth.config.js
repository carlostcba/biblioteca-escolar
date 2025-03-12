// config/auth.config.js
require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || "biblioteca-escolar-super-secret-key-change-in-production",
  jwtExpiration: 86400, // 24 horas en segundos
  jwtRefreshExpiration: 604800, // 7 días en segundos
};