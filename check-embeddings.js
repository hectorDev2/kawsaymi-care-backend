const { Pool } = require('pg');
require('dotenv').config();

async function check() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  // Verificar los embeddings almacenados con función de pgvector
  const result = await pool.query(`
    SELECT 
      c.id,
      c.page,
      c.content,
      d.title,
      array_dims(c.embedding) as dims,
      c.embedding::text
    FROM public.knowledge_document_chunks c
    JOIN public.knowledge_documents d ON c.document_id = d.id
    LIMIT 3
  `);

  console.log('=== CHUNKS CON EMBEDDINGS ===\n');
  result.rows.forEach((row, i) => {
    console.log(`[Chunk ${i + 1}] ${row.title} - Pág ${row.page}`);
    console.log(`    Dimensiones: ${row.dims}`);
    console.log(`    Embedding (primeros 10 valores): ${row.embedding?.slice(0, 10)}`);
    console.log(`    ¿Es null?: ${row.embedding === null}`);
    console.log();
  });

  // Contar chunks con embedding null
  const nullCheck = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE embedding IS NULL) as nulls,
      COUNT(*) FILTER (WHERE embedding IS NOT NULL) as non_nulls,
      COUNT(*) as total
    FROM public.knowledge_document_chunks
  `);

  console.log('=== ESTADO DE EMBEDDINGS ===');
  console.log(`Nulls: ${nullCheck.rows[0].nulls}`);
  console.log(`Non-nulls: ${nullCheck.rows[0].non_nulls}`);
  console.log(`Total: ${nullCheck.rows[0].total}`);

  await pool.end();
}

check().catch(console.error);
