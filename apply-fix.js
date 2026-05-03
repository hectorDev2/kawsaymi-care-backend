const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyFix() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  const sqlPath = path.join(__dirname, 'supabase/migrations/20260501120000_fix_vector_search.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('Aplicando migration...\n');
  
  try {
    await pool.query(sql);
    console.log('✅ Migration aplicada exitosamente');

    // Verificar que la función se actualizó
    const result = await pool.query(`
      SELECT pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = 'match_document_chunks'
    `);

    console.log('\n=== Nueva definición de match_document_chunks ===\n');
    console.log(result.rows[0]?.def);

    await pool.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

applyFix();
