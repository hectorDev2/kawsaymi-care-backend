const { Pool } = require('pg');
require('dotenv').config();

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Ver schemas existentes
  const schemas = await pool.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'extensions')
    ORDER BY schema_name
  `);

  console.log('=== SCHEMAS ===');
  schemas.rows.forEach(r => console.log(`  - ${r.schema_name}`));

  // Ver tablas en public
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);

  console.log('\n=== TABLAS EN PUBLIC ===');
  tables.rows.forEach(r => console.log(`  - ${r.table_name}`));

  // Ver si hay tabla de usuarios con otro nombre
  const userTables = await pool.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name LIKE '%user%' OR table_name LIKE '%auth%'
    ORDER BY table_schema, table_name
  `);

  console.log('\n=== POSIBLES TABLAS DE USUARIOS ===');
  userTables.rows.forEach(r => console.log(`  - ${r.table_schema}.${r.table_name}`));

  await pool.end();
}

check().catch(console.error);
