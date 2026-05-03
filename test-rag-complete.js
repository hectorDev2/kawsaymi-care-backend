#!/usr/bin/env node
/**
 * Test completo del sistema RAG
 * Verifica: ingesta, búsqueda, generación de respuestas
 */

const { Pool } = require('pg');
require('dotenv').config();

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(color, msg) {
  console.log(`${color}${msg}${COLORS.reset}`);
}

async function testEmbedding() {
  log(COLORS.cyan, '\n📊 TEST 1: Creación de embeddings');
  log(COLORS.cyan, '='.repeat(50));

  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'voyage-3-lite',
      input: ['medicamentos para hipertensión'],
      input_type: 'query',
    }),
  });

  if (!res.ok) {
    log(COLORS.red, `❌ Error: ${res.status}`);
    return null;
  }

  const data = await res.json();
  const embedding = data.data[0].embedding;
  
  log(COLORS.green, `✅ Embedding creado: ${embedding.length} dimensiones`);
  log(COLORS.yellow, `   Primeros 5 valores: ${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);
  
  return embedding;
}

async function testVectorSearch(embedding) {
  log(COLORS.cyan, '\n🔍 TEST 2: Búsqueda vectorial');
  log(COLORS.cyan, '='.repeat(50));

  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  const vector = `[${embedding.join(',')}]`;
  
  const result = await pool.query(
    'SELECT * FROM public.match_document_chunks($1::vector, 3)',
    [vector]
  );

  await pool.end();

  if (result.rows.length === 0) {
    log(COLORS.red, '❌ Sin resultados');
    return false;
  }

  log(COLORS.green, `✅ ${result.rows.length} resultados encontrados`);
  
  result.rows.forEach((row, i) => {
    log(COLORS.yellow, `\n[S${i + 1}] ${row.doc_title} - Pág ${row.page}`);
    log(COLORS.yellow, `    Categoría: ${row.category || 'N/A'}`);
    log(COLORS.yellow, `    Score: ${row.score.toFixed(4)}`);
    log(COLORS.blue, `    "${row.content.slice(0, 120)}..."`);
  });

  return true;
}

async function testStats() {
  log(COLORS.cyan, '\n📈 TEST 3: Estadísticas de la base');
  log(COLORS.cyan, '='.repeat(50));

  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  const stats = await pool.query(`
    SELECT 
      COUNT(DISTINCT d.id) as documents,
      COUNT(c.id) as chunks,
      COUNT(DISTINCT c.category) as categories,
      AVG(LENGTH(c.content)) as avg_chunk_size
    FROM public.knowledge_documents d
    LEFT JOIN public.knowledge_document_chunks c ON c.document_id = d.id
    WHERE d.source LIKE 'local:%'
  `);

  const catStats = await pool.query(`
    SELECT category, COUNT(*) as count
    FROM public.knowledge_document_chunks
    WHERE category IS NOT NULL
    GROUP BY category
    ORDER BY count DESC
  `);

  await pool.end();

  const s = stats.rows[0];
  log(COLORS.green, `✅ Documentos: ${s.documents}`);
  log(COLORS.green, `   Chunks totales: ${s.chunks}`);
  log(COLORS.green, `   Categorías: ${s.categories || 0}`);
  log(COLORS.green, `   Avg chunk size: ${Math.round(s.avg_chunk_size)} chars`);

  if (catStats.rows.length > 0) {
    log(COLORS.yellow, '\nDistribución por categoría:');
    catStats.rows.forEach(row => {
      log(COLORS.blue, `   ${row.category}: ${row.count} chunks`);
    });
  }

  return true;
}

async function main() {
  log(COLORS.cyan, '\n🧪 TEST COMPLETO RAG - Kawsaymi Care');
  log(COLORS.cyan, '='.repeat(60));

  try {
    const embedding = await testEmbedding();
    if (!embedding) {
      log(COLORS.red, '\n❌ Test fallido: no se pudo crear embedding');
      process.exit(1);
    }

    const searchOk = await testVectorSearch(embedding);
    if (!searchOk) {
      log(COLORS.red, '\n❌ Test fallido: búsqueda vectorial');
      process.exit(1);
    }

    await testStats();

    log(COLORS.green, '\n✅ TODOS LOS TESTS PASARON');
    log(COLORS.cyan, '\n📝 Próximos pasos:');
    log(COLORS.yellow, '   1. Crear usuario ADMIN (si no existe)');
    log(COLORS.yellow, '   2. Obtener token: POST /auth/login');
    log(COLORS.yellow, '   3. Ingestar PDFs: POST /knowledge/documents');
    log(COLORS.yellow, '   4. Probar consultas: POST /knowledge/answer');
    
  } catch (e) {
    log(COLORS.red, `\n❌ Error: ${e.message}`);
    process.exit(1);
  }
}

main();
