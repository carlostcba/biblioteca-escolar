// reset-password.js modificado
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

// Configuración de la conexión a la base de datos
const sequelize = new Sequelize('BibliotecaEscolar', 'sa', 'LaSalle2599', {
  dialect: 'mssql',
  host: 'localhost',
  dialectOptions: {
    options: {
      instanceName: 'SQLEXPRESS',
      encrypt: false,
      trustServerCertificate: true,
      connectTimeout: 30000
    }
  }
});

// Función para restablecer la contraseña
async function resetPassword() {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('Conexión establecida correctamente.');
    
    // Email del usuario a modificar
    const userEmail = 'ctello@lasalle.edu.ar';
    
    // Verificar si el usuario existe
    const [users] = await sequelize.query(
      `SELECT id, nombre, apellido FROM Usuarios WHERE email = :email`,
      {
        replacements: { email: userEmail },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!users || users.length === 0) {
      console.log(`❌ No se encontró ningún usuario con el email ${userEmail}`);
      return;
    }
    
    const user = users[0];
    console.log(`✅ Usuario encontrado: ${user.nombre} ${user.apellido}`);
    
    // Nueva contraseña
    const newPassword = '@Lasalle2599';
    
    // Generar hash de la contraseña
    const hashedPassword = bcrypt.hashSync(newPassword, 8);
    
    // Actualizar la contraseña en la base de datos
    await sequelize.query(
      `UPDATE Usuarios SET password = :hashedPassword WHERE email = :email`,
      {
        replacements: { 
          hashedPassword: hashedPassword,
          email: userEmail 
        },
        type: sequelize.QueryTypes.UPDATE
      }
    );
    
    console.log('✅ Contraseña actualizada correctamente');
    console.log(`🔑 La nueva contraseña para ${userEmail} es: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error al restablecer la contraseña:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await sequelize.close();
    console.log('Conexión cerrada.');
  }
}

// Ejecutar la función
resetPassword();