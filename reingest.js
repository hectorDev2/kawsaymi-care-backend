const { Pool } = require('pg');
require('dotenv').config();

async function reingest() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  console.log('Eliminando chunks existentes para forzar re-ingesta...\n');

  // Eliminar chunks del documento "BASE DE DATOS.pdf"
  const result = await pool.query(`
    DELETE FROM public.knowledge_document_chunks
    WHERE document_id IN (
      SELECT id FROM public.knowledge_documents
      WHERE source = 'local:BASE DE DATOS.pdf'
    )
    RETURNING id
  `);

  console.log(`✅ ${result.rowCount} chunks eliminados`);

  // Resetear metadata del documento
  await pool.query(`
    UPDATE public.knowledge_documents
    SET metadata = jsonb_set(
      metadata,
      '{ingestComplete}',
      'false'::jsonb
    )
    WHERE source = 'local:BASE DE DATOS.pdf'
  `);

  console.log('✅ Documento marcado para re-ingesta');
  console.log('\nAhora ejecutá: curl -X POST "http://localhost:3001/knowledge/documents?force=true" -H "Authorization: Bearer <admin_token>"');

  await pool.end();
}

reingest().catch(console.error);
