import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from './index.js';

describe('SeamDoc API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    // Clear API key env to run in dev mode (all requests pass through)
    delete process.env['SEAMDOC_API_KEYS'];
    app = createApp();
  });

  // ─── Health ──────────────────────────────────────────────────────────────

  it('GET /v1/health returns 200', async () => {
    const res = await app.request('/v1/health', { method: 'GET' });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body['status']).toBe('ok');
    expect(body['version']).toBe('0.1.0');
  });

  // ─── Formats ─────────────────────────────────────────────────────────────

  it('GET /v1/formats lists all supported formats', async () => {
    const res = await app.request('/v1/formats', { method: 'GET' });
    expect(res.status).toBe(200);
    const body = await res.json() as { formats: Array<{ id: string }> };
    const ids = body.formats.map((f) => f.id);
    expect(ids).toContain('docx');
    expect(ids).toContain('pdf');
    expect(ids).toContain('html');
    expect(ids).toContain('pptx');
    expect(ids).toContain('odt');
  });

  // ─── Render ──────────────────────────────────────────────────────────────

  it('POST /v1/render returns a render document', async () => {
    const res = await app.request('/v1/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: '# Hello\n\nWorld.' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toHaveProperty('renderDocument');
    expect(body).toHaveProperty('settings');
  });

  it('POST /v1/render returns 400 when markdown is missing', async () => {
    const res = await app.request('/v1/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'pdf' }),
    });
    expect(res.status).toBe(400);
  });

  // ─── Compile ─────────────────────────────────────────────────────────────

  it('POST /v1/compile returns a binary document (docx)', async () => {
    const res = await app.request('/v1/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: '# Test\n\nHello world.', format: 'docx' }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(res.headers.get('Content-Disposition')).toContain('document.docx');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);
  });

  it('POST /v1/compile returns odt format', async () => {
    const res = await app.request('/v1/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: '# ODT\n\nTest.', format: 'odt', filename: 'myfile' }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/vnd.oasis.opendocument.text');
    expect(res.headers.get('Content-Disposition')).toContain('myfile.odt');
  });

  it('POST /v1/compile returns 400 for unsupported format', async () => {
    const res = await app.request('/v1/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: '# Test', format: 'xlsx' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as Record<string, unknown>;
    expect(body['code']).toBe('UNSUPPORTED_FORMAT');
  });

  it('POST /v1/compile returns 400 when markdown is missing', async () => {
    const res = await app.request('/v1/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'pdf' }),
    });
    expect(res.status).toBe(400);
  });

  // ─── Auth ────────────────────────────────────────────────────────────────

  it('returns 401 when api key is required but missing', async () => {
    process.env['SEAMDOC_API_KEYS'] = 'secret-key-123';
    const authApp = createApp();

    const res = await authApp.request('/v1/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: '# Test' }),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as Record<string, unknown>;
    expect(body['code']).toBe('INVALID_API_KEY');

    delete process.env['SEAMDOC_API_KEYS'];
  });

  it('allows request with valid api key', async () => {
    process.env['SEAMDOC_API_KEYS'] = 'valid-key';
    const authApp = createApp();

    const res = await authApp.request('/v1/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'valid-key' },
      body: JSON.stringify({ markdown: '# Authenticated' }),
    });
    expect(res.status).toBe(200);

    delete process.env['SEAMDOC_API_KEYS'];
  });
});
