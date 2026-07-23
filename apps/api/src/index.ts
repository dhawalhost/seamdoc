/**
 * SeamDoc Cloud API Server
 * Hono-based REST service — compatible with Node.js and edge runtimes.
 *
 * Routes:
 *   GET  /v1/health   — Liveness probe
 *   GET  /v1/formats  — List supported export formats
 *   POST /v1/render   — Return render tree JSON (debug/preview)
 *   POST /v1/compile  — Compile markdown to an exported document
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { compileRoute } from './routes/compile.js';
import { healthRoute, formatsRoute, renderRoute } from './routes/misc.js';
import { workspacesRoute } from './routes/workspaces.js';

export function createApp(): Hono {
  const app = new Hono();

  // Global middleware
  app.use('*', logger());
  app.use(
    '*',
    cors({
      origin: process.env['SEAMDOC_ALLOWED_ORIGINS'] ?? '*',
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'x-api-key'],
      exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],
    }),
  );

  // Health (no auth needed)
  app.get('/v1/health', healthRoute);
  app.get('/v1/formats', formatsRoute);

  // Authenticated + rate-limited routes
  app.use('/v1/*', authMiddleware);
  app.use('/v1/*', rateLimitMiddleware);

  app.post('/v1/render', renderRoute);
  app.post('/v1/compile', compileRoute);
  app.route('/v1/workspaces', workspacesRoute);

  // 404 handler
  app.notFound((c) => c.json({ error: 'Not found', code: 'NOT_FOUND' }, 404));

  // Global error handler
  app.onError((err, c) => {
    console.error('[api] Unhandled error:', err);
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500);
  });

  return app;
}

// Node.js entry point (run directly with `node dist/index.js`)
const port = parseInt(process.env['PORT'] ?? '3001', 10);

if (process.env.NODE_ENV !== 'test') {
  import('@hono/node-server')
    .then(({ serve }) => {
      const app = createApp();
      serve({ fetch: app.fetch, port }, () => {
        console.log(`[seamdoc-api] Listening on http://localhost:${port}`);
      });
    })
    .catch((err: unknown) => {
      console.error('[seamdoc-api] Failed to start server:', err);
      process.exit(1);
    });
}
