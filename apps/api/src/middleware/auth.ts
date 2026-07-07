/**
 * API key authentication middleware.
 * Keys are configured via the SEAMDOC_API_KEYS env var (comma-separated list).
 * If no keys are configured, all requests are allowed (dev mode).
 */

import type { Context, Next } from 'hono';

const ENV_KEY = 'SEAMDOC_API_KEYS';

function getConfiguredKeys(): Set<string> {
  const raw = process.env[ENV_KEY];
  if (!raw || raw.trim() === '') return new Set();
  return new Set(
    raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean),
  );
}

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const keys = getConfiguredKeys();

  // Dev mode: no keys configured, all requests pass through.
  if (keys.size === 0) {
    await next();
    return;
  }

  const header = c.req.header('x-api-key') ?? '';
  if (!header || !keys.has(header)) {
    return c.json({ error: 'Unauthorized', code: 'INVALID_API_KEY' }, 401);
  }

  await next();
}
