const { Pool } = require('pg');
require('dotenv').config();

async function testSearch() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  const questions = [
    "¿Qué enfermedades crónicas hay en Perú?",
    "medicamentos para hipertensión",
    "tratamiento diabetes tipo 2",
  ];

  const embeddingEndpoint = 'https://api.voyageai.com/v1/embeddings';
  const apiKey = process.env.VOYAGE_API_KEY;

  for (const q of questions) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`PREGUNTA: ${q}`);
    console.log('='.repeat(60));

    // 1. Crear embedding
    const embedRes = await fetch(embeddingEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.VOYAGE_EMBED_MODEL || 'voyage-3-lite',
        input: [q],
        input_type: 'query',
      }),
    });

    if (!embedRes.ok) {
      console.error(`Error embedding: ${embedRes.status}`);
      continue;
    }

    const embedData = await embedRes.json();
    const embedding = embedData.data[0].embedding;

    // 2. Búsqueda vectorial
    const vector = `[${embedding.join(',')}]`;
    const searchRes = await pool.query(`
      SELECT 
        c.content,
        c.page,
        c.chunk_index,
        d.title as doc_title,
        1 - (c.embedding <=> $1::extensions.vector) as score
      FROM public.knowledge_document_chunks c
      JOIN public.knowledge_documents d ON c.document_id = d.id
      ORDER BY c.embedding <=> $1::extensions.vector
      LIMIT 3
    `, [vector]);

    if (searchRes.rows.length === 0) {
      console.log('⚠️  No se encontraron resultados');
      continue;
    }

    console.log(`\nTop ${searchRes.rows.length} chunks encontrados:\n`);
    searchRes.rows.forEach((row, i) => {
      console.log(`[S${i + 1}] ${row.doc_title} - Página ${row.page} (score: ${row.score.toFixed(3)})`);
      console.log(`    "${row.content.slice(0, 200)}..."`);
      console.log();
    });
  }

  await pool.end();
}

testSearch().catch(console.error);
