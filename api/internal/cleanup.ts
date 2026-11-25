import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sha256, timingSafeEqualHex } from '../_lib/crypto.js';
import { withTransaction } from '../_lib/db.js';
import { sendJson } from '../_lib/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    sendJson(res, 503, { ok: false, error: 'CRON_SECRET no configurado' });
    return;
  }

  const authHeader = req.headers.authorization;
  const bearer =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';

  if (!bearer || !timingSafeEqualHex(sha256(bearer), sha256(cronSecret))) {
    sendJson(res, 401, { ok: false, error: 'No autorizado' });
    return;
  }

  try {
    const purged = await withTransaction(async (client) => {
      const sessionsRes = await client.query(
        `DELETE FROM user_sessions
         WHERE expires_at < NOW()
            OR idle_expires_at < NOW()
            OR (revoked_at IS NOT NULL AND revoked_at < NOW() - interval '7 days')`
      );

      const tokensRes = await client.query(
        `DELETE FROM auth_tokens
         WHERE expires_at < NOW()
            OR (used_at IS NOT NULL AND used_at < NOW() - interval '7 days')`
      );

      const oauthRes = await client.query(
        `DELETE FROM oauth_states
         WHERE expires_at < NOW()`
      );

      const rateLimitsRes = await client.query(
        `DELETE FROM rate_limits
         WHERE (blocked_until IS NULL OR blocked_until < NOW())
           AND window_start < NOW() - interval '1 day'`
      );

      return {
        sessions: sessionsRes.rowCount ?? 0,
        tokens: tokensRes.rowCount ?? 0,
        oauthStates: oauthRes.rowCount ?? 0,
        rateLimits: rateLimitsRes.rowCount ?? 0,
      };
    });

    sendJson(res, 200, {
      ok: true,
      purged,
      executedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[INTERNAL CLEANUP ERROR]', err);
    sendJson(res, 500, { ok: false, error: 'Error al ejecutar limpieza TTL' });
  }
}
