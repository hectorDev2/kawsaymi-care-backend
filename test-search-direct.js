const { Pool } = require('pg');
require('dotenv').config();

async function testSearch() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  const apiKey = process.env.VOYAGE_API_KEY;

  // Crear embedding real
  const embedRes = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'voyage-3-lite',
      input: ['medicamentos para hipertensión'],
      input_type: 'query',
    }),
  });

  const embedData = await embedRes.json();
  const embedding = embedData.data[0].embedding;

  console.log('Embedding creado:', embedding.length, 'dimensiones');

  // Búsqueda directa SIN especificar tamaño en el cast
  const vector = `[${embedding.join(',')}]`;
  
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.page,
        c.content,
        d.title as doc_title,
        1 - (c.embedding <=> $1::vector) as score
      FROM public.knowledge_document_chunks c
      JOIN public.knowledge_documents d ON c.document_id = d.id
      ORDER BY c.embedding <=> $1::vector
      LIMIT 5
    `, [vector]);

    console.log('\n=== RESULTADOS ===');
    console.log(`Filas encontradas: ${result.rows.length}`);
    
    result.rows.forEach((row, i) => {
      console.log(`\n[S${i + 1}] ${row.doc_title} - Pág ${row.page} - Score: ${row.score.toFixed(4)}`);
      console.log(`    "${row.content.slice(0, 200)}..."`);
    });
  } catch (e) {
    console.error('\n=== ERROR ===');
    console.error(e.message);
  }

  await pool.end();
}

testSearch().catch(console.error);
