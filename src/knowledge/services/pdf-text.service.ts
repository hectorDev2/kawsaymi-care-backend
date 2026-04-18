import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export type PdfPageText = { page: number; text: string };

type PdfTextItem = { str?: string };

type PdfTextContent = { items: unknown[] };

type PdfPage = {
  getTextContent: () => Promise<PdfTextContent>;
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNum: number) => Promise<PdfPage>;
};

@Injectable()
export class PdfTextService {
  async extractPagesFromFile(filePath: string): Promise<PdfPageText[]> {
    // pdfjs-dist legacy build is ESM; use dynamic import to work in CommonJS builds.
    const pdfjsLib =
      (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as {
        getDocument: (args: {
          data: Uint8Array;
          disableFontFace?: boolean;
          useSystemFonts?: boolean;
          standardFontDataUrl?: string;
          StandardFontDataFactory?: new (args: { baseUrl?: string | null }) => {
            fetch: (args: { filename: string }) => Promise<Uint8Array>;
          };
        }) => {
          promise: Promise<PdfDocument>;
        };
      };

    const buf = await readFile(filePath);
    // pdfjs rejects Node Buffers; use a plain Uint8Array.
    const data = new Uint8Array(buf);

    const standardFontPath = path.join(
      process.cwd(),
      'node_modules',
      'pdfjs-dist',
      'standard_fonts',
    );
    const standardFontDataUrl = pathToFileURL(standardFontPath + path.sep).href;

    class FsStandardFontDataFactory {
      constructor(private readonly args: { baseUrl?: string | null }) {}

      async fetch({ filename }: { filename: string }): Promise<Uint8Array> {
        const baseUrl = this.args.baseUrl ?? standardFontDataUrl;
        const fontUrl = new URL(filename, baseUrl);
        const fontPath = fileURLToPath(fontUrl);
        const fontBuf = await readFile(fontPath);
        return new Uint8Array(fontBuf);
      }
    }

    // Text extraction only, but pdfjs may still try to resolve standard fonts.
    const loadingTask = pdfjsLib.getDocument({
      data,
      disableFontFace: true,
      useSystemFonts: true,
      standardFontDataUrl,
      StandardFontDataFactory: FsStandardFontDataFactory,
    });
    const doc = await loadingTask.promise;

    const pages: PdfPageText[] = [];
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      const items = content.items as unknown as PdfTextItem[];
      const text = items
        .map((it) => (typeof it.str === 'string' ? it.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      pages.push({ page: pageNum, text });
    }

    return pages;
  }
}
