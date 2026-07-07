/**
 * In-memory sliding-window rate limiter.
 * Default: 100 requests per 60 seconds per API key (or IP in dev mode).
 * Configurable via SEAMDOC_RATE_LIMIT_RPM env var.
 */

import type { Context, Next } from 'hono';

const DEFAULT_RPM = 100;
const WINDOW_MS = 60_000;

interface WindowEntry {
  readonly timestamps: number[];
}

const store = new Map<string, WindowEntry>();

function getRpm(): number {
  const raw = process.env['SEAMDOC_RATE_LIMIT_RPM'];
  if (!raw) return DEFAULT_RPM;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) || parsed <= 0 ? DEFAULT_RPM : parsed;
}

function getIdentifier(c: Context): string {
  // Use API key if present, otherwise fall back to client IP.
  return c.req.header('x-api-key') || c.req.header('x-forwarded-for') || 'anonymous';
}

export async function rateLimitMiddleware(c: Context, next: Next): Promise<Response | void> {
  const key = getIdentifier(c);
  const now = Date.now();
  const rpm = getRpm();
  const windowStart = now - WINDOW_MS;

  const entry = store.get(key) ?? { timestamps: [] };
  // Evict timestamps outside the window.
  const recent = entry.timestamps.filter((t) => t > windowStart);

  if (recent.length >= rpm) {
    const retryAfter = Math.ceil((recent[0]! + WINDOW_MS - now) / 1000);
    c.header('Retry-After', String(retryAfter));
    c.header('X-RateLimit-Limit', String(rpm));
    c.header('X-RateLimit-Remaining', '0');
    return c.json({ error: 'Too Many Requests', code: 'RATE_LIMIT_EXCEEDED' }, 429);
  }

  recent.push(now);
  store.set(key, { timestamps: recent });

  c.header('X-RateLimit-Limit', String(rpm));
  c.header('X-RateLimit-Remaining', String(rpm - recent.length));

  await next();
}
