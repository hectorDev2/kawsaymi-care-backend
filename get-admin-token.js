const { Pool } = require('pg');
require('dotenv').config();

async function getAdminToken() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Verificar usuarios existentes
  const users = await pool.query(`
    SELECT id, email, role, name 
    FROM public.users 
    ORDER BY created_at DESC
    LIMIT 10
  `);

  console.log('=== USUARIOS EXISTENTES ===\n');
  users.rows.forEach((u, i) => {
    console.log(`[${i + 1}] ${u.name || 'N/A'} <${u.email}> - Role: ${u.role}`);
  });

  const adminUsers = users.rows.filter(u => u.role === 'ADMIN');
  
  if (adminUsers.length === 0) {
    console.log('\n⚠️  No hay usuarios ADMIN.');
    console.log('Opción 1: Registrá un usuario con POST /auth/register y luego promovelo manualmente en la DB');
    console.log('Opción 2: Usá el endpoint sin auth si está disponible (solo dev)');
  } else {
    console.log(`\n✅ Hay ${adminUsers.length} usuario(s) ADMIN`);
    console.log('\nPara obtener el token, ejecutá:');
    console.log(`curl -X POST "http://localhost:3001/auth/login" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"email":"${adminUsers[0].email}","password":"<tu-password>"}'`);
  }

  await pool.end();
}

getAdminToken();
