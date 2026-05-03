const { Pool } = require('pg');
require('dotenv').config();

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const users = await pool.query(`
    SELECT id, email, role, name, "createdAt", "updatedAt"
    FROM public."User"
    ORDER BY "createdAt" DESC
    LIMIT 10
  `);

  console.log('=== USUARIOS ===\n');
  users.rows.forEach((u, i) => {
    console.log(`[${i + 1}] ${u.name || 'N/A'} <${u.email}>`);
    console.log(`    Role: ${u.role}`);
    console.log(`    Creado: ${u.createdAt}`);
    console.log();
  });

  const admins = users.rows.filter(u => u.role === 'ADMIN');
  console.log(`\nTotal: ${users.rows.length} usuarios, ${admins.length} ADMINs`);

  await pool.end();
}

check().catch(console.error);
