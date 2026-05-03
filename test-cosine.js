const { Pool } = require('pg');
require('dotenv').config();

async function test() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  const apiKey = process.env.VOYAGE_API_KEY;

  // Crear embedding
  const embedRes = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

  console.log('Query: hipertensión');
  console.log('Embedding dims:', embedding.length);

  // Probar diferentes operadores de distancia
  const tests = [
    { name: '<=> (cosine distance)', sql: `c.embedding <=> $1::vector` },
    { name: '<#> (negative inner product)', sql: `c.embedding <#> $1::vector` },
    { name: '<-> (L2 distance)', sql: `c.embedding <-> $1::vector` },
  ];

  for (const test of tests) {
    try {
      const result = await pool.query(`
        SELECT 
          c.page,
          LEFT(c.content, 80) as preview,
          ${test.sql} as distance
        FROM public.knowledge_document_chunks c
        ORDER BY ${test.sql}
        LIMIT 2
      `, [vector]);

      console.log(`\n=== ${test.name} ===`);
      console.log(`Resultados: ${result.rows.length}`);
      result.rows.forEach(row => {
        console.log(`  Pág ${row.page} | dist: ${row.distance?.toFixed(6)} | "${row.preview}..."`);
      });
    } catch (e) {
      console.log(`\n=== ${test.name} === ERROR: ${e.message}`);
    }
  }

  await pool.end();
}

test().catch(console.error);
