const { Pool } = require('pg');
require('dotenv').config();

async function ver() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  // Ver contenido de chunks
  const chunks = await pool.query(`
    SELECT c.id, c.page, c.chunk_index, LENGTH(c.content) as len, c.content,
           d.title
    FROM public.knowledge_document_chunks c
    JOIN public.knowledge_documents d ON c.document_id = d.id
    ORDER BY c.page, c.chunk_index
    LIMIT 10
  `);

  console.log('=== PRIMEROS 10 CHUNKS ===\n');
  chunks.rows.forEach((row, i) => {
    console.log(`[Chunk ${i + 1}] ${row.title} - Pág ${row.page}, Chunk ${row.chunk_index} (${row.len} chars)`);
    console.log(`    "${row.content}"`);
    console.log();
  });

  // Ver si los embeddings tienen datos
  const embedCheck = await pool.query(`
    SELECT 
      id,
      page,
      embedding[1:5] as first_5_dims,
      array_length(embedding, 1) as total_dims
    FROM public.knowledge_document_chunks
    LIMIT 3
  `);

  console.log('\n=== VERIFICAR EMBEDDINGS ===');
  embedCheck.rows.forEach(row => {
    console.log(`Chunk ${row.id}: dims=${row.total_dims}, primeros valores=${JSON.stringify(row.first_5_dims)}`);
  });

  await pool.end();
}

ver().catch(console.error);
