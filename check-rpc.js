const { Pool } = require('pg');
require('dotenv').config();

async function checkRpc() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  // Ver definición de la función
  const funcDef = await pool.query(`
    SELECT pg_get_functiondef(p.oid) as def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'match_document_chunks'
  `);

  console.log('=== DEFINICIÓN DE match_document_chunks ===\n');
  console.log(funcDef.rows[0]?.def || 'No encontrada');

  // Probar llamando a la función con un embedding dummy
  const dummyEmbedding = Array(512).fill(0.01);
  const vector = `[${dummyEmbedding.join(',')}]`;

  try {
    const result = await pool.query(`
      SELECT * FROM public.match_document_chunks($1::extensions.vector, 3)
    `, [vector]);
    
    console.log('\n=== RESULTADO DE LA FUNCIÓN ===');
    console.log(`Filas retornadas: ${result.rows.length}`);
    if (result.rows.length > 0) {
      console.log('Primera fila:', result.rows[0]);
    }
  } catch (e) {
    console.error('\n=== ERROR AL LLAMAR LA FUNCIÓN ===');
    console.error(e.message);
  }

  await pool.end();
}

checkRpc().catch(console.error);
