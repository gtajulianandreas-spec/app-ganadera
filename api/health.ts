import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_lib/db.js';
import { sendJson } from './_lib/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  if (!process.env.DATABASE_URL) {
    sendJson(res, 503, {
      ok: false,
      status: 'unconfigured',
      db: 'missing_database_url',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const startedAt = Date.now();
  try {
    await query('SELECT 1');
    sendJson(res, 200, {
      ok: true,
      status: 'healthy',
      db: 'connected',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[HEALTHCHECK ERROR]', err);
    sendJson(res, 503, {
      ok: false,
      status: 'degraded',
      db: 'unreachable',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  }
}
