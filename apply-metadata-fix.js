const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyFix() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  const sqlPath = path.join(__dirname, 'supabase/migrations/20260501120500_add_chunk_metadata.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('Aplicando migration de metadata...\n');
  
  try {
    await pool.query(sql);
    console.log('✅ Migration aplicada exitosamente');

    await pool.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

applyFix();
