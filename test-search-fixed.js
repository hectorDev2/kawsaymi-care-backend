const { Pool } = require('pg');
require('dotenv').config();

async function test() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  const apiKey = process.env.VOYAGE_API_KEY;

  const questions = [
    'medicamentos para hipertensión',
    'enfermedades cardiovasculares',
    'tratamiento diabetes',
  ];

  for (const q of questions) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`QUERY: "${q}"`);
    console.log('='.repeat(60));

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
      'SELECT * FROM public.match_document_chunks($1::vector, 3)',
      [vector]
    );

    if (result.rows.length === 0) {
      console.log('⚠️  Sin resultados');
      continue;
    }

    result.rows.forEach((row, i) => {
      console.log(`\n[S${i + 1}] ${row.doc_title} - Pág ${row.page} | Score: ${row.score.toFixed(4)}`);
      console.log(`    "${row.content.slice(0, 180)}..."`);
    });
  }

  await pool.end();
}

test().catch(console.error);
