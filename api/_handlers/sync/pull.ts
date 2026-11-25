import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withUserTransaction } from '../../_lib/db.js';
import { sendJson } from '../../_lib/http.js';
import { checkRateLimit } from '../../_lib/rateLimit.js';
import { getAuthenticatedSession } from '../../_lib/session.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      sendJson(res, 401, { ok: false, error: 'Autenticación requerida' });
      return;
    }

    const rl = await checkRateLimit(`sync_pull:${session.userId}`, 120, 60, 60);
    if (!rl.allowed) {
      res.setHeader('Retry-After', String(rl.retryAfterSeconds));
      sendJson(res, 429, { ok: false, error: 'Demasiadas solicitudes de lectura' });
      return;
    }

    const rawSince = Array.isArray(req.query.since_seq) ? req.query.since_seq[0] : req.query.since_seq;
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;

    const sinceSeq = Math.max(0, Number.parseInt(String(rawSince || '0'), 10) || 0);
    const limit = Math.min(200, Math.max(1, Number.parseInt(String(rawLimit || '100'), 10) || 100));

    const result = await withUserTransaction(session.userId, async (client) => {
      const rowsRes = await client.query<{
        farm_id: string;
        entity_type: string;
        entity_id: string;
        payload: Record<string, unknown>;
        version: number;
        deleted_at: Date | null;
        server_seq: string;
      }>(
        `SELECT fe.farm_id, fe.entity_type, fe.entity_id, fe.payload, fe.version, fe.deleted_at, fe.server_seq
         FROM farm_entities fe
         INNER JOIN farm_memberships fm
           ON fm.farm_id = fe.farm_id
          AND fm.user_id = $1
         WHERE fe.server_seq > $2
         ORDER BY fe.server_seq ASC
         LIMIT $3`,
        [session.userId, sinceSeq, limit + 1]
      );

      const hasMore = rowsRes.rows.length > limit;
      const slice = hasMore ? rowsRes.rows.slice(0, limit) : rowsRes.rows;

      let latestSeq = sinceSeq;
      const changes = slice.map((row) => {
        const seq = Number(row.server_seq);
        if (seq > latestSeq) latestSeq = seq;
        return {
          farmId: row.farm_id,
          entityType: row.entity_type,
          entityId: row.entity_id,
          payload: row.payload,
          version: row.version,
          deleted: row.deleted_at !== null,
          serverSeq: seq,
        };
      });

      return { changes, latestSeq, hasMore };
    });

    sendJson(res, 200, { ok: true, ...result });
  } catch (err) {
    console.error('[SYNC PULL ERROR]', err);
    sendJson(res, 500, { ok: false, error: 'Error interno al consultar sincronización' });
  }
}
