const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Importar servicios manualmente (versión simplificada)
async function extractTextFromPDF(filePath) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const buf = await fs.promises.readFile(filePath);
  const data = new Uint8Array(buf);
  
  const standardFontPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts');
  const standardFontDataUrl = 'file://' + standardFontPath + '/';
  
  class FsStandardFontDataFactory {
    constructor(args) { this.args = args; }
    async fetch({ filename }) {
      const baseUrl = this.args.baseUrl ?? standardFontDataUrl;
      const fontUrl = new URL(filename, baseUrl);
      const fontPath = new URL(fontUrl).pathname;
      const fontBuf = await fs.promises.readFile(fontPath);
      return new Uint8Array(fontBuf);
    }
  }
  
  const loadingTask = pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: true,
    standardFontDataUrl,
    StandardFontDataFactory: FsStandardFontDataFactory,
  });
  
  const doc = await loadingTask.promise;
  const pages = [];
  
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const text = content.items
      .map(it => it.str || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages.push({ page: pageNum, text });
  }
  
  return pages;
}

function detectCategory(text) {
  const keywords = {
    cardiovascular: ['cardiovascular', 'cardiaco', 'corazón', 'arterial', 'hipertensión', 'infarto'],
    metabolica: ['diabetes', 'metabólico', 'obesidad', 'colesterol', 'dislipidemia'],
    respiratoria: ['respiratorio', 'pulmón', 'pulmonar', 'EPOC', 'asma'],
    medicamentos: ['medicamento', 'fármaco', 'tratamiento', 'dosis'],
  };
  
  const lower = text.toLowerCase();
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.filter(w => lower.includes(w)).length >= 2) return cat;
  }
  return null;
}

function chunkPages(pages, chunkSize = 800, overlap = 100) {
  const chunks = [];
  
  for (const p of pages) {
    if (!p.text || p.text.trim().length < 50) continue;
    
    const paragraphs = p.text.split(/\n\s*\n/).map(s => s.trim()).filter(s => s.length > 50);
    let current = '';
    let idx = 0;
    
    for (const para of paragraphs) {
      if (current.length + para.length <= chunkSize) {
        current += (current ? ' ' : '') + para;
      } else {
        if (current.trim()) {
          chunks.push({
            page: p.page,
            chunkIndex: idx++,
            content: current.trim(),
            category: detectCategory(current),
          });
        }
        current = para;
      }
    }
    
    if (current?.trim()) {
      chunks.push({
        page: p.page,
        chunkIndex: idx,
        content: current.trim(),
        category: detectCategory(current),
      });
    }
  }
  
  return chunks;
}

async function createEmbedding(text) {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'voyage-3-lite',
      input: [text],
      input_type: 'document',
    }),
  });
  
  if (!res.ok) throw new Error(`Voyage error: ${res.status}`);
  const data = await res.json();
  return data.data[0].embedding;
}

async function reingest() {
  const pool = new Pool({
    connectionString: process.env.VECTOR_DATABASE_URL,
  });

  const pdfPath = path.join(process.cwd(), 'pdfs_descargados', 'BASE DE DATOS.pdf');
  const source = 'local:BASE DE DATOS.pdf';
  
  console.log('📄 Leyendo PDF:', pdfPath);
  const pages = await extractTextFromPDF(pdfPath);
  console.log(`✅ ${pages.length} páginas extraídas`);
  
  console.log('\n✂️  Creando chunks semánticos...');
  const chunks = chunkPages(pages);
  console.log(`✅ ${chunks.length} chunks creados`);
  
  // Obtener o crear documento
  const docRes = await pool.query(`
    INSERT INTO public.knowledge_documents (source, title, metadata, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT (source) DO UPDATE SET 
      title = EXCLUDED.title,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
    RETURNING id
  `, [
    source,
    'BASE DE DATOS.pdf',
    {
      kind: 'pdf',
      fileName: 'BASE DE DATOS.pdf',
      pages: pages.length,
      embeddingProvider: 'voyage',
      embeddingModel: 'voyage-3-lite',
      embeddingDims: 512,
      ingestComplete: false,
    },
  ]);
  
  const documentId = docRes.rows[0].id;
  console.log(`\n📁 Documento ID: ${documentId}`);
  
  console.log('\n🔢 Creando embeddings e insertando chunks...');
  let inserted = 0;
  
  for (let i = 0; i < chunks.length; i += 3) {
    const batch = chunks.slice(i, i + 3);
    console.log(`  Procesando chunks ${i + 1}-${Math.min(i + 3, chunks.length)}...`);
    
    const embeddings = await Promise.all(batch.map(c => createEmbedding(c.content)));
    
    const values = [];
    const rowsSql = [];
    for (let j = 0; j < batch.length; j++) {
      const c = batch[j];
      const base = j * 6;
      rowsSql.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}::vector, $${base + 6})`);
      values.push(
        documentId,
        c.page,
        c.chunkIndex,
        c.content,
        `[${embeddings[j].join(',')}]`,
        c.category || null,
      );
    }
    
    await pool.query(`
      INSERT INTO public.knowledge_document_chunks (document_id, page, chunk_index, content, embedding, category)
      VALUES ${rowsSql.join(',')}
      ON CONFLICT (document_id, page, chunk_index)
      DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding, category = EXCLUDED.category
    `, values);
    
    inserted += batch.length;
    await new Promise(r => setTimeout(r, 21000)); // Rate limit Voyage
  }
  
  // Marcar como completo
  await pool.query(`
    UPDATE public.knowledge_documents
    SET metadata = jsonb_set(metadata, '{ingestComplete}', 'true'::jsonb)
    WHERE id = $1
  `, [documentId]);
  
  console.log(`\n✅ Re-ingesta completada: ${inserted} chunks insertados`);
  
  // Verificar
  const stats = await pool.query(`
    SELECT COUNT(*) as chunks, COUNT(DISTINCT category) FILTER (WHERE category IS NOT NULL) as categories
    FROM public.knowledge_document_chunks
    WHERE document_id = $1
  `, [documentId]);
  
  console.log(`\n📊 Stats:`);
  console.log(`   Chunks totales: ${stats.rows[0].chunks}`);
  console.log(`   Categorías detectadas: ${stats.rows[0].categories || 0}`);
  
  await pool.end();
}

reingest().catch(console.error);
