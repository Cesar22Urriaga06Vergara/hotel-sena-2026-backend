/**
 * Script para cargar usuarios de áreas operacionales a la base de datos
 * Ejecutar con: node scripts/migrations/ejecutar-crear-usuarios.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function ejecutarMigracion() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    // Configuración de conexión (ajustar según sea necesario)
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root', // Ajustar si tienes contraseña diferente
      database: 'hotel',
      multipleStatements: true
    });

    console.log('✅ Conexión establecida');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'crear-usuarios-areas.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Ejecutando script SQL...\n');

    // Ejecutar el SQL
    const [results] = await connection.query(sqlContent);

    console.log('✅ Script ejecutado exitosamente\n');

    // Verificar los usuarios creados
    const [usuarios] = await connection.query(`
      SELECT id, cedula, nombre, apellido, email, rol, estado 
      FROM empleados 
      WHERE email IN (
        'lavanderia@gmail.com', 'spa@gmail.com', 'roomservice@gmail.com',
        'minibar@gmail.com', 'transporte@gmail.com', 'tours@gmail.com',
        'eventos@gmail.com', 'mantenimiento@gmail.com'
      )
      ORDER BY rol
    `);

    console.log('👥 Usuarios creados:');
    console.table(usuarios.map(u => ({
      ID: u.id,
      Email: u.email,
      Rol: u.rol,
      Nombre: `${u.nombre} ${u.apellido}`,
      Estado: u.estado
    })));

    console.log('\n📊 Resumen por rol:');
    const [resumen] = await connection.query(`
      SELECT rol, COUNT(*) as total
      FROM empleados
      WHERE estado = 'activo'
      GROUP BY rol
      ORDER BY rol
    `);
    console.table(resumen);

    console.log('\n🎉 Migración completada exitosamente!');
    console.log('📧 Correos creados:');
    usuarios.forEach(u => {
      console.log(`   - ${u.email} (${u.rol})`);
    });
    console.log('🔑 Contraseña para todos: 123456789\n');

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('\n⚠️  Algunos usuarios ya existen en la base de datos.');
      console.log('   Revisa los emails duplicados y elimínalos si es necesario.');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la migración
ejecutarMigracion();
