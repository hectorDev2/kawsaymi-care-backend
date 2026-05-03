const { Pool } = require('pg');
require('dotenv').config();

async function debug() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  // 1. Verificar que existen chunks
  const chunksCheck = await pool.query(`
    SELECT COUNT(*) as count, 
           MIN(LENGTH(content)) as min_len,
           MAX(LENGTH(content)) as max_len
    FROM public.knowledge_document_chunks
  `);
  console.log('Chunks existentes:', chunksCheck.rows[0]);

  // 2. Verificar estructura de la tabla
  const tableInfo = await pool.query(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'knowledge_document_chunks'
    ORDER BY ordinal_position
  `);
  console.log('\nEstructura de knowledge_document_chunks:');
  tableInfo.rows.forEach(row => {
    console.log(`  ${row.column_name}: ${row.data_type} ${row.udt_name || ''}`);
  });

  // 3. Verificar función RPC
  const funcCheck = await pool.query(`
    SELECT proname, prosrc
    FROM pg_proc
    WHERE proname = 'match_document_chunks'
  `);
  console.log('\nFunciones match_document_chunks encontradas:', funcCheck.rows.length);

  // 4. Probar búsqueda directa sin RPC
  const embedRes = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'voyage-3-lite',
      input: ['hipertensión'],
      input_type: 'query',
    }),
  });

  const embedData = await embedRes.json();
  const embedding = embedData.data[0].embedding;
  const vector = `[${embedding.join(',')}]`;

  console.log('\nEmbedding dims:', embedding.length);
  console.log('Primeros 5 valores:', embedding.slice(0, 5).map(v => v.toFixed(4)));

  // 5. Búsqueda directa
  try {
    const directSearch = await pool.query(`
      SELECT 
        c.content,
        c.page,
        1 - (c.embedding <=> $1::extensions.vector(512)) as score
      FROM public.knowledge_document_chunks c
      ORDER BY c.embedding <=> $1::extensions.vector(512)
      LIMIT 3
    `, [vector]);

    console.log('\nBúsqueda directa (sin RPC):');
    directSearch.rows.forEach((row, i) => {
      console.log(`\n[S${i + 1}] Página ${row.page} - Score: ${row.score.toFixed(4)}`);
      console.log(`    "${row.content.slice(0, 150)}..."`);
    });
  } catch (e) {
    console.error('\nError en búsqueda directa:', e.message);
  }

  await pool.end();
}

debug().catch(console.error);
