const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.VECTOR_DATABASE_URL,
});

async function check() {
  try {
    const docsRes = await pool.query(`
      SELECT id, source, title, metadata, created_at 
      FROM public.knowledge_documents 
      ORDER BY created_at DESC
    `);
    
    console.log('=== DOCUMENTOS ===');
    console.log(`Total: ${docsRes.rows.length}`);
    docsRes.rows.forEach((row, i) => {
      console.log(`\n[${i + 1}] ${row.title || 'Sin título'}`);
      console.log(`    Source: ${row.source}`);
      console.log(`    Páginas: ${row.metadata?.pages || 'N/A'}`);
      console.log(`    Ingesta completa: ${row.metadata?.ingestComplete || false}`);
      console.log(`    Embedding dims: ${row.metadata?.embeddingDims || 'N/A'}`);
    });
    
    const chunksRes = await pool.query(`
      SELECT COUNT(*)::int as total, 
             COUNT(DISTINCT document_id) as docs_with_chunks
      FROM public.knowledge_document_chunks
    `);
    
    console.log('\n=== CHUNKS ===');
    console.log(`Total chunks: ${chunksRes.rows[0].total}`);
    console.log(`Documentos con chunks: ${chunksRes.rows[0].docs_with_chunks}`);
    
    const statsRes = await pool.query(`
      SELECT d.title, d.source, COUNT(c.id) as chunks
      FROM public.knowledge_documents d
      LEFT JOIN public.knowledge_document_chunks c ON c.document_id = d.id
      GROUP BY d.id
      ORDER BY chunks DESC
    `);
    
    console.log('\n=== STATS POR DOCUMENTO ===');
    statsRes.rows.forEach((row, i) => {
      console.log(`[${i + 1}] ${row.title}: ${row.chunks} chunks`);
    });
    
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

check();
