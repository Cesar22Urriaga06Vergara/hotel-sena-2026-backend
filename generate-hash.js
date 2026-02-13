// Script para generar hash de password con bcrypt
// Ejecutar con: node generate-hash.js

const bcrypt = require('bcrypt');

const password = 'Cesar2206';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generando hash:', err);
    return;
  }
  
  console.log('\n=== Hash generado ===');
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('\n=== SQL para insertar usuario ===');
  console.log(`
INSERT INTO users (email, password, fullName, role, isActive, createdAt, updatedAt) 
VALUES (
  'urriagac44@gmail.com',
  '${hash}',
  'Cesar Urriaga',
  'admin',
  1,
  NOW(),
  NOW()
);
  `);
});
