/**
 * Collaborative Workspaces REST API routes.
 *
 * POST   /v1/workspaces                      — Create workspace
 * GET    /v1/workspaces/:id                  — Get workspace + theme/template list
 * DELETE /v1/workspaces/:id                  — Delete workspace
 * PUT    /v1/workspaces/:id/themes/:key      — Upsert a shared theme JSON
 * GET    /v1/workspaces/:id/themes/:key      — Get a single shared theme
 * DELETE /v1/workspaces/:id/themes/:key      — Remove a shared theme
 * PUT    /v1/workspaces/:id/templates/:key   — Upsert a shared template (base64)
 * GET    /v1/workspaces/:id/templates/:key   — Get a single shared template
 * DELETE /v1/workspaces/:id/templates/:key   — Remove a shared template
 */

import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { getDb } from '../db/schema.js';

export const workspacesRoute = new Hono();

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkspaceRow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ThemeRow {
  id: string;
  workspace_id: string;
  theme_key: string;
  theme_json: string;
  updated_at: string;
}

interface TemplateRow {
  id: string;
  workspace_id: string;
  template_key: string;
  template_b64: string;
  updated_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function requireWorkspace(id: string): WorkspaceRow | null {
  const db = getDb();
  return (
    db.prepare<[string], WorkspaceRow>('SELECT * FROM workspaces WHERE id = ?').get(id) ?? null
  );
}

// ─── POST /v1/workspaces ──────────────────────────────────────────────────────

workspacesRoute.post('/', async (c) => {
  let body: { name?: unknown; description?: unknown };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_BODY' }, 400);
  }

  if (typeof body.name !== 'string' || body.name.trim() === '') {
    return c.json(
      { error: '`name` is required and must be a non-empty string', code: 'INVALID_PARAM' },
      422,
    );
  }

  const id = randomUUID();
  const name = body.name.trim().slice(0, 200);
  const description =
    typeof body.description === 'string' ? body.description.trim().slice(0, 1000) : '';

  const db = getDb();
  db.prepare('INSERT INTO workspaces (id, name, description) VALUES (?, ?, ?)').run(
    id,
    name,
    description,
  );

  const workspace = requireWorkspace(id);
  return c.json({ workspace }, 201);
});

// ─── GET /v1/workspaces/:id ───────────────────────────────────────────────────

workspacesRoute.get('/:id', (c) => {
  const { id } = c.req.param();
  const workspace = requireWorkspace(id);
  if (workspace === null) {
    return c.json({ error: 'Workspace not found', code: 'NOT_FOUND' }, 404);
  }

  const db = getDb();
  const themes = db
    .prepare<[string], { theme_key: string; updated_at: string }>(
      'SELECT theme_key, updated_at FROM workspace_themes WHERE workspace_id = ? ORDER BY theme_key',
    )
    .all(id);
  const templates = db
    .prepare<[string], { template_key: string; updated_at: string }>(
      'SELECT template_key, updated_at FROM workspace_templates WHERE workspace_id = ? ORDER BY template_key',
    )
    .all(id);

  return c.json({ workspace, themes, templates });
});

// ─── DELETE /v1/workspaces/:id ────────────────────────────────────────────────

workspacesRoute.delete('/:id', (c) => {
  const { id } = c.req.param();
  if (requireWorkspace(id) === null) {
    return c.json({ error: 'Workspace not found', code: 'NOT_FOUND' }, 404);
  }
  const db = getDb();
  db.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
  return c.json({ deleted: true });
});

// ─── PUT /v1/workspaces/:id/themes/:key ───────────────────────────────────────

workspacesRoute.put('/:id/themes/:key', async (c) => {
  const { id, key } = c.req.param();
  if (requireWorkspace(id) === null) {
    return c.json({ error: 'Workspace not found', code: 'NOT_FOUND' }, 404);
  }

  let themeJson: string;
  try {
    const body = await c.req.json();
    themeJson = JSON.stringify(body); // normalise
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_BODY' }, 400);
  }

  const db = getDb();
  const existing = db
    .prepare<[string, string], ThemeRow>(
      'SELECT * FROM workspace_themes WHERE workspace_id = ? AND theme_key = ?',
    )
    .get(id, key);

  if (existing !== undefined) {
    db.prepare(
      "UPDATE workspace_themes SET theme_json = ?, updated_at = datetime('now') WHERE workspace_id = ? AND theme_key = ?",
    ).run(themeJson, id, key);
  } else {
    db.prepare(
      'INSERT INTO workspace_themes (id, workspace_id, theme_key, theme_json) VALUES (?, ?, ?, ?)',
    ).run(randomUUID(), id, key, themeJson);
  }

  return c.json({ workspace_id: id, key, updated: true });
});

// ─── GET /v1/workspaces/:id/themes/:key ───────────────────────────────────────

workspacesRoute.get('/:id/themes/:key', (c) => {
  const { id, key } = c.req.param();
  if (requireWorkspace(id) === null) {
    return c.json({ error: 'Workspace not found', code: 'NOT_FOUND' }, 404);
  }

  const db = getDb();
  const row = db
    .prepare<[string, string], ThemeRow>(
      'SELECT * FROM workspace_themes WHERE workspace_id = ? AND theme_key = ?',
    )
    .get(id, key);

  if (row === undefined) {
    return c.json({ error: 'Theme not found', code: 'NOT_FOUND' }, 404);
  }

  return c.json({
    workspace_id: id,
    key: row.theme_key,
    theme: JSON.parse(row.theme_json) as unknown,
  });
});

// ─── DELETE /v1/workspaces/:id/themes/:key ────────────────────────────────────

workspacesRoute.delete('/:id/themes/:key', (c) => {
  const { id, key } = c.req.param();
  if (requireWorkspace(id) === null) {
    return c.json({ error: 'Workspace not found', code: 'NOT_FOUND' }, 404);
  }
  const db = getDb();
  db.prepare('DELETE FROM workspace_themes WHERE workspace_id = ? AND theme_key = ?').run(id, key);
  return c.json({ deleted: true });
});

// ─── PUT /v1/workspaces/:id/templates/:key ────────────────────────────────────

workspacesRoute.put('/:id/templates/:key', async (c) => {
  const { id, key } = c.req.param();
  if (requireWorkspace(id) === null) {
    return c.json({ error: 'Workspace not found', code: 'NOT_FOUND' }, 404);
  }

  let body: { data?: unknown };
  try {
    body = (await c.req.json()) as typeof body;
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_BODY' }, 400);
  }

  if (typeof body.data !== 'string' || body.data === '') {
    return c.json({ error: '`data` must be a base64-encoded string', code: 'INVALID_PARAM' }, 422);
  }

  const db = getDb();
  const existing = db
    .prepare<[string, string], TemplateRow>(
      'SELECT * FROM workspace_templates WHERE workspace_id = ? AND template_key = ?',
    )
    .get(id, key);

  if (existing !== undefined) {
    db.prepare(
      "UPDATE workspace_templates SET template_b64 = ?, updated_at = datetime('now') WHERE workspace_id = ? AND template_key = ?",
    ).run(body.data, id, key);
  } else {
    db.prepare(
      'INSERT INTO workspace_templates (id, workspace_id, template_key, template_b64) VALUES (?, ?, ?, ?)',
    ).run(randomUUID(), id, key, body.data);
  }

  return c.json({ workspace_id: id, key, updated: true });
});

// ─── GET /v1/workspaces/:id/templates/:key ────────────────────────────────────

workspacesRoute.get('/:id/templates/:key', (c) => {
  const { id, key } = c.req.param();
  if (requireWorkspace(id) === null) {
    return c.json({ error: 'Workspace not found', code: 'NOT_FOUND' }, 404);
  }

  const db = getDb();
  const row = db
    .prepare<[string, string], TemplateRow>(
      'SELECT * FROM workspace_templates WHERE workspace_id = ? AND template_key = ?',
    )
    .get(id, key);

  if (row === undefined) {
    return c.json({ error: 'Template not found', code: 'NOT_FOUND' }, 404);
  }

  return c.json({ workspace_id: id, key: row.template_key, data: row.template_b64 });
});

// ─── DELETE /v1/workspaces/:id/templates/:key ─────────────────────────────────

workspacesRoute.delete('/:id/templates/:key', (c) => {
  const { id, key } = c.req.param();
  if (requireWorkspace(id) === null) {
    return c.json({ error: 'Workspace not found', code: 'NOT_FOUND' }, 404);
  }
  const db = getDb();
  db.prepare('DELETE FROM workspace_templates WHERE workspace_id = ? AND template_key = ?').run(
    id,
    key,
  );
  return c.json({ deleted: true });
});
