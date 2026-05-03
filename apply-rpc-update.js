const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function apply() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  const sql = fs.readFileSync(
    path.join(__dirname, 'supabase/migrations/20260501121000_add_metadata_to_rpc.sql'),
    'utf-8'
  );

  await pool.query(sql);
  console.log('✅ Función RPC actualizada para incluir category y tags');

  // Testear
  const apiKey = process.env.VOYAGE_API_KEY;
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
  const vector = `[${embedData.data[0].embedding.join(',')}]`;

  const result = await pool.query(
    'SELECT * FROM public.match_document_chunks($1::vector, 2)',
    [vector]
  );

  console.log('\n=== TEST RPC ACTUALIZADO ===\n');
  result.rows.forEach((row, i) => {
    console.log(`[S${i + 1}] Pág ${row.page} - Score: ${row.score.toFixed(4)}`);
    console.log(`    Categoría: ${row.category || 'N/A'}`);
    console.log(`    Tags: ${row.tags?.join(', ') || 'N/A'}`);
    console.log(`    "${row.content.slice(0, 120)}..."`);
    console.log();
  });

  await pool.end();
}

apply().catch(console.error);
