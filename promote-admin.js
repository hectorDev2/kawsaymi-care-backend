const { Pool } = require('pg');
require('dotenv').config();

async function promote() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const email = 'hector@gmail.com';

  await pool.query(
    'UPDATE public."User" SET role = $1 WHERE email = $2',
    ['ADMIN', email]
  );

  console.log(`✅ Usuario ${email} promovido a ADMIN`);
  console.log('\n=== CREDENCIALES ADMIN ===');
  console.log('Email: hector@gmail.com');
  console.log('Password: (la que hayas usado al registrar)');
  console.log('\nObtené tu token:');
  console.log('curl -X POST "http://localhost:3001/auth/login" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"email":"hector@gmail.com","password":"<tu-password>"}\'');

  await pool.end();
}

promote();
