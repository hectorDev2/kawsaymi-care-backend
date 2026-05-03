const { Pool } = require('pg');
require('dotenv').config();

async function check() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  const result = await pool.query(`
    SELECT 
      d.title,
      COUNT(c.id) as chunks,
      COUNT(c.category) as chunks_with_category,
      COUNT(DISTINCT c.category) as categories,
      array_agg(DISTINCT c.category) FILTER (WHERE c.category IS NOT NULL) as cats
    FROM public.knowledge_documents d
    LEFT JOIN public.knowledge_document_chunks c ON c.document_id = d.id
    WHERE d.source LIKE 'local:BASE DE DATOS%'
    GROUP BY d.id, d.title
  `);

  console.log('=== PROGRESO RE-INGESTA ===\n');
  result.rows.forEach(row => {
    console.log(`Documento: ${row.title}`);
    console.log(`  Chunks: ${row.chunks}`);
    console.log(`  Con categoría: ${row.chunks_with_category}`);
    console.log(`  Categorías únicas: ${row.categories || 0}`);
    console.log(`  Categorías: ${row.cats?.join(', ') || 'N/A'}`);
  });

  await pool.end();
}

check().catch(console.error);
