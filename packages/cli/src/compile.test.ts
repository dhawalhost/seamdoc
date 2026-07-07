import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { compileDocument } from './compile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.resolve(__dirname, '../temp');

describe('compileDocument', () => {
  beforeEach(async () => {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  });

  it('compiles Markdown to a DOCX document', async () => {
    const mdPath = path.join(TEMP_DIR, 'test.md');
    const outPath = path.join(TEMP_DIR, 'output.docx');
    await fs.writeFile(mdPath, '# Hello World\nThis is a test.');

    const result = await compileDocument(mdPath, {
      output: outPath,
      theme: 'minimal',
      format: 'docx',
    });

    expect(result).toBe(outPath);
    const exists = await fs
      .access(outPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it('compiles Markdown to a PDF document', async () => {
    const mdPath = path.join(TEMP_DIR, 'test.md');
    const outPath = path.join(TEMP_DIR, 'output.pdf');
    await fs.writeFile(mdPath, '# Hello World\nThis is a test.');

    const result = await compileDocument(mdPath, {
      output: outPath,
      theme: 'minimal',
      format: 'pdf',
    });

    expect(result).toBe(outPath);
    const exists = await fs
      .access(outPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it('layers custom settings overrides', async () => {
    const mdPath = path.join(TEMP_DIR, 'test.md');
    const outPath = path.join(TEMP_DIR, 'output.docx');
    await fs.writeFile(mdPath, '# Hello World\nThis is a test.');

    const result = await compileDocument(mdPath, {
      output: outPath,
      theme: 'minimal',
      format: 'docx',
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      orientation: 'landscape',
      margins: '36,36,36,36',
    });

    expect(result).toBe(outPath);
    const exists = await fs
      .access(outPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it('fails if input file does not exist', async () => {
    await expect(
      compileDocument(path.join(TEMP_DIR, 'nonexistent.md'), {
        output: path.join(TEMP_DIR, 'out.docx'),
      }),
    ).rejects.toThrow('Failed to read input file');
  });

  it('fails if theme is not found', async () => {
    const mdPath = path.join(TEMP_DIR, 'test.md');
    await fs.writeFile(mdPath, '# Hello World');
    await expect(
      compileDocument(mdPath, {
        theme: 'nonexistent-theme',
      }),
    ).rejects.toThrow('Built-in theme "nonexistent-theme" not found.');
  });
});
