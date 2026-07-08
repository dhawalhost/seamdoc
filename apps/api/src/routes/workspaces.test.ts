/**
 * Integration tests for the /v1/workspaces routes.
 *
 * Uses an in-memory SQLite DB by setting SEAMDOC_DB_PATH to ':memory:'
 * before each test suite to ensure full isolation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../index.js';
import { closeDb } from '../db/schema.js';

type JsonRecord = Record<string, unknown>;

describe('Workspaces API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    // Use a unique tmp file per test run for isolation
    process.env['SEAMDOC_DB_PATH'] = `:memory:`;
    delete process.env['SEAMDOC_API_KEYS'];
    closeDb(); // force new connection using the new path
    app = createApp();
  });

  afterEach(() => {
    closeDb();
    delete process.env['SEAMDOC_DB_PATH'];
  });

  // ─── Create workspace ────────────────────────────────────────────────────

  it('POST /v1/workspaces creates a workspace', async () => {
    const res = await app.request('/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'My Team', description: 'Design system workspace' }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { workspace: JsonRecord };
    expect(typeof body.workspace['id']).toBe('string');
    expect(body.workspace['name']).toBe('My Team');
    expect(body.workspace['description']).toBe('Design system workspace');
  });

  it('POST /v1/workspaces returns 422 when name is missing', async () => {
    const res = await app.request('/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'No name here' }),
    });
    expect(res.status).toBe(422);
  });

  // ─── Get workspace ────────────────────────────────────────────────────────

  it('GET /v1/workspaces/:id returns workspace with empty lists', async () => {
    const createRes = await app.request('/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Engineering' }),
    });
    const { workspace } = (await createRes.json()) as { workspace: JsonRecord };
    const id = workspace['id'] as string;

    const res = await app.request(`/v1/workspaces/${id}`, { method: 'GET' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      workspace: JsonRecord;
      themes: unknown[];
      templates: unknown[];
    };
    expect(body.workspace['id']).toBe(id);
    expect(Array.isArray(body.themes)).toBe(true);
    expect(body.themes).toHaveLength(0);
    expect(body.templates).toHaveLength(0);
  });

  it('GET /v1/workspaces/:id returns 404 for unknown id', async () => {
    const res = await app.request('/v1/workspaces/does-not-exist', { method: 'GET' });
    expect(res.status).toBe(404);
  });

  // ─── Delete workspace ────────────────────────────────────────────────────

  it('DELETE /v1/workspaces/:id removes the workspace', async () => {
    const createRes = await app.request('/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Temp' }),
    });
    const { workspace } = (await createRes.json()) as { workspace: JsonRecord };
    const id = workspace['id'] as string;

    const delRes = await app.request(`/v1/workspaces/${id}`, { method: 'DELETE' });
    expect(delRes.status).toBe(200);

    const getRes = await app.request(`/v1/workspaces/${id}`, { method: 'GET' });
    expect(getRes.status).toBe(404);
  });

  // ─── Themes ───────────────────────────────────────────────────────────────

  it('PUT then GET /v1/workspaces/:id/themes/:key round-trips a theme', async () => {
    const createRes = await app.request('/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Brand' }),
    });
    const { workspace } = (await createRes.json()) as { workspace: JsonRecord };
    const id = workspace['id'] as string;

    const theme = { metadata: { id: 'corporate', name: 'Corporate', version: '1.0' } };

    const putRes = await app.request(`/v1/workspaces/${id}/themes/corporate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theme),
    });
    expect(putRes.status).toBe(200);

    const getRes = await app.request(`/v1/workspaces/${id}/themes/corporate`, { method: 'GET' });
    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as { theme: JsonRecord };
    expect((body.theme['metadata'] as JsonRecord)['id']).toBe('corporate');
  });

  it('DELETE /v1/workspaces/:id/themes/:key removes the theme', async () => {
    const createRes = await app.request('/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'W' }),
    });
    const { workspace } = (await createRes.json()) as { workspace: JsonRecord };
    const id = workspace['id'] as string;

    await app.request(`/v1/workspaces/${id}/themes/t1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color: 'red' }),
    });

    const delRes = await app.request(`/v1/workspaces/${id}/themes/t1`, { method: 'DELETE' });
    expect(delRes.status).toBe(200);

    const getRes = await app.request(`/v1/workspaces/${id}/themes/t1`, { method: 'GET' });
    expect(getRes.status).toBe(404);
  });

  // ─── Templates ────────────────────────────────────────────────────────────

  it('PUT then GET /v1/workspaces/:id/templates/:key round-trips a template', async () => {
    const createRes = await app.request('/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Legal' }),
    });
    const { workspace } = (await createRes.json()) as { workspace: JsonRecord };
    const id = workspace['id'] as string;

    const fakeBase64 = Buffer.from('fake-docx-bytes').toString('base64');

    const putRes = await app.request(`/v1/workspaces/${id}/templates/standard`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: fakeBase64 }),
    });
    expect(putRes.status).toBe(200);

    const getRes = await app.request(`/v1/workspaces/${id}/templates/standard`, { method: 'GET' });
    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as { data: string };
    expect(body.data).toBe(fakeBase64);
  });

  it('workspace list shows theme after upload', async () => {
    const createRes = await app.request('/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Full' }),
    });
    const { workspace } = (await createRes.json()) as { workspace: JsonRecord };
    const id = workspace['id'] as string;

    await app.request(`/v1/workspaces/${id}/themes/dark`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ background: 'black' }),
    });

    const getRes = await app.request(`/v1/workspaces/${id}`, { method: 'GET' });
    const body = (await getRes.json()) as { themes: Array<{ theme_key: string }> };
    expect(body.themes).toHaveLength(1);
    expect(body.themes[0]?.theme_key).toBe('dark');
  });
});
