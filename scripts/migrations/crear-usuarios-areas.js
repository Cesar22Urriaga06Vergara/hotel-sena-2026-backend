const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = '123456789';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash de la contraseña "123456789":');
  console.log(hash);
}

hashPassword();
