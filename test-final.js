const { Pool } = require('pg');
require('dotenv').config();

async function test() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  const apiKey = process.env.VOYAGE_API_KEY;

  const questions = [
    { q: 'medicamentos para hipertensión', expected: ['IECA', 'ARA-II', 'diuréticos'] },
    { q: 'enfermedades cardiovasculares más comunes', expected: ['coronaria', 'hipertensión'] },
    { q: 'tratamiento diabetes tipo 2', expected: ['metformina', 'insulina'] },
  ];

  for (const { q, expected } of questions) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`QUERY: "${q}"`);
    console.log('='.repeat(70));

    const embedRes = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'voyage-3-lite',
        input: [q],
        input_type: 'query',
      }),
    });

    const embedData = await embedRes.json();
    const embedding = embedData.data[0].embedding;
    const vector = `[${embedding.join(',')}]`;

    const result = await pool.query(
      `SELECT * FROM public.match_document_chunks($1::vector, 3)`,
      [vector]
    );

    if (result.rows.length === 0) {
      console.log('⚠️  Sin resultados');
      continue;
    }

    result.rows.forEach((row, i) => {
      console.log(`\n[S${i + 1}] ${row.doc_title} - Pág ${row.page}`);
      console.log(`    Categoría: ${row.category || 'N/A'}`);
      console.log(`    Score: ${row.score.toFixed(4)}`);
      console.log(`    "${row.content.slice(0, 150)}..."`);
    });
  }

  // Ver distribución de categorías
  const catStats = await pool.query(`
    SELECT category, COUNT(*) as count
    FROM public.knowledge_document_chunks
    WHERE document_id IN (
      SELECT id FROM public.knowledge_documents WHERE source = 'local:BASE DE DATOS.pdf'
    )
    GROUP BY category
    ORDER BY count DESC
  `);

  console.log('\n\n=== DISTRIBUCIÓN DE CATEGORÍAS ===');
  catStats.rows.forEach(row => {
    console.log(`  ${row.category || 'Sin categoría'}: ${row.count} chunks`);
  });

  await pool.end();
}

test().catch(console.error);
