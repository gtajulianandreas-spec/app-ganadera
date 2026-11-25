import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { withUserTransaction } from '../_lib/db.js';
import { parseJsonBody, sendJson, verifyCsrfProtection } from '../_lib/http.js';
import { checkRateLimit } from '../_lib/rateLimit.js';
import { getAuthenticatedSession } from '../_lib/session.js';

const SyncActionSchema = z.object({
  id: z.string().min(1).max(128),
  entityType: z.enum([
    'farm',
    'animal',
    'lot',
    'pasture',
    'reproduction',
    'milking',
    'weight',
    'health',
    'finance',
  ]),
  actionType: z.enum(['create', 'update', 'delete']),
  entityId: z.string().min(1).max(128),
  payload: z.record(z.string(), z.unknown()),
  timestamp: z.number().optional(),
});

const PushBodySchema = z.object({
  actions: z.array(SyncActionSchema).min(1).max(100),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      sendJson(res, 401, { ok: false, error: 'Autenticación requerida' });
      return;
    }

    const csrf = verifyCsrfProtection(req, session.csrfTokenHash);
    if (!csrf.ok) {
      sendJson(res, 403, { ok: false, error: 'Validación CSRF fallida' });
      return;
    }

    const rl = await checkRateLimit(`sync_push:${session.userId}`, 60, 60, 120);
    if (!rl.allowed) {
      res.setHeader('Retry-After', String(rl.retryAfterSeconds));
      sendJson(res, 429, { ok: false, error: 'Demasiadas solicitudes de sincronización' });
      return;
    }

    const body = parseJsonBody(req);
    const parsed = PushBodySchema.safeParse(body);
    if (!parsed.success) {
      sendJson(res, 400, { ok: false, error: 'Formato de lote de sincronización inválido' });
      return;
    }

    const result = await withUserTransaction(session.userId, async (client) => {
      const appliedIds: string[] = [];
      const rejected: Array<{ id: string; reason: string }> = [];
      let latestSeq = 0;

      for (const action of parsed.data.actions) {
        const idempRes = await client.query<{ event_id: string }>(
          `INSERT INTO sync_applied_events (event_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (event_id) DO NOTHING
           RETURNING event_id`,
          [action.id, session.userId]
        );

        if (idempRes.rows.length === 0) {
          appliedIds.push(action.id);
          continue;
        }

        const rawFarmId =
          action.entityType === 'farm'
            ? action.entityId
            : typeof action.payload.farmId === 'string'
            ? action.payload.farmId
            : '';
        const farmId = rawFarmId.trim();

        if (!farmId || farmId.length > 128) {
          await client.query(`DELETE FROM sync_applied_events WHERE event_id = $1`, [action.id]);
          rejected.push({ id: action.id, reason: 'Missing or invalid farmId' });
          continue;
        }

        if (action.entityType === 'farm' && action.actionType === 'create') {
          await client.query(
            `INSERT INTO farm_memberships (farm_id, user_id, role)
             VALUES ($1, $2, 'admin')
             ON CONFLICT (farm_id, user_id) DO NOTHING`,
            [farmId, session.userId]
          );
        }

        const memberRes = await client.query<{ role: string }>(
          `SELECT role FROM farm_memberships WHERE farm_id = $1 AND user_id = $2`,
          [farmId, session.userId]
        );

        const role = memberRes.rows[0]?.role;
        if (!role || !['admin', 'zootechnician', 'veterinarian', 'worker'].includes(role)) {
          await client.query(`DELETE FROM sync_applied_events WHERE event_id = $1`, [action.id]);
          rejected.push({ id: action.id, reason: 'Forbidden for farm' });
          continue;
        }

        const version =
          typeof action.payload.version === 'number' && Number.isFinite(action.payload.version)
            ? Math.max(1, Math.floor(action.payload.version))
            : 1;

        const upsertRes = await client.query<{ server_seq: string }>(
          `INSERT INTO farm_entities (
             farm_id, entity_type, entity_id, owner_user_id, payload, version, deleted_at, server_seq, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5::jsonb, $6,
             CASE WHEN $7 = 'delete' THEN NOW() ELSE NULL END,
             nextval('farm_entities_seq_global'),
             NOW()
           )
           ON CONFLICT (farm_id, entity_type, entity_id)
           DO UPDATE SET
             payload = EXCLUDED.payload,
             version = GREATEST(farm_entities.version, EXCLUDED.version) + 1,
             deleted_at = CASE WHEN $7 = 'delete' THEN NOW() ELSE NULL END,
             server_seq = nextval('farm_entities_seq_global'),
             updated_at = NOW()
           RETURNING server_seq`,
          [
            farmId,
            action.entityType,
            action.entityId,
            session.userId,
            JSON.stringify(action.payload),
            version,
            action.actionType,
          ]
        );

        const seq = Number(upsertRes.rows[0]?.server_seq || 0);
        if (seq > latestSeq) latestSeq = seq;
        appliedIds.push(action.id);
      }

      return { appliedIds, rejected, latestSeq };
    });

    sendJson(res, 200, { ok: true, ...result });
  } catch (err) {
    console.error('[SYNC PUSH ERROR]', err);
    sendJson(res, 500, { ok: false, error: 'Error interno al sincronizar cambios' });
  }
}
