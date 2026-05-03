const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

async function createAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const email = 'admin@kawsaymi.com';
  const password = 'Admin123!';
  const name = 'Administrador';
  
  // Hashear password (usando el mismo método que el backend)
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Verificar si ya existe
    const existing = await pool.query(
      'SELECT id, role FROM public.users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      console.log(`Usuario ya existe: ${email}`);
      console.log(`Role actual: ${user.role}`);
      
      if (user.role !== 'ADMIN') {
        console.log('\nPromoviendo a ADMIN...');
        await pool.query(
          'UPDATE public.users SET role = $1 WHERE email = $2',
          ['ADMIN', email]
        );
        console.log('✅ Usuario promovido a ADMIN');
      }
      
      console.log('\n=== CREDENCIALES ===');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log('\nUsá POST /auth/login para obtener el token');
    } else {
      // Crear usuario admin
      const result = await pool.query(
        `INSERT INTO public.users (email, password, name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, email, role`,
        [email, hashedPassword, name, 'ADMIN']
      );
      
      console.log('✅ Usuario ADMIN creado:');
      console.log(`ID: ${result.rows[0].id}`);
      console.log(`Email: ${result.rows[0].email}`);
      console.log(`Role: ${result.rows[0].role}`);
      console.log('\n=== CREDENCIALES ===');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    }

    await pool.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

createAdmin();
