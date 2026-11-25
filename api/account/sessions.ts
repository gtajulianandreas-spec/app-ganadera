import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { query } from '../_lib/db.js';
import { parseJsonBody, sendJson, verifyCsrfProtection } from '../_lib/http.js';
import { getAuthenticatedSession, revokeAllUserSessions } from '../_lib/session.js';
import { recordSecurityEvent } from '../_lib/audit.js';

const RevokeSchema = z.object({
  sessionIdPrefix: z.string().regex(/^[a-f0-9]{12,64}$/, 'Identificador de sesión inválido.').optional(),
  revokeAllOthers: z.boolean().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      sendJson(res, 401, { error: 'Sesión no válida.' });
      return;
    }

    if (req.method === 'GET') {
      const rowsRes = await query<{
        id: string;
        user_agent: string | null;
        created_at: string;
        last_seen_at: string;
        expires_at: string;
      }>(
        `SELECT id, user_agent, created_at, last_seen_at, expires_at
         FROM user_sessions
         WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW() AND idle_expires_at > NOW()
         ORDER BY last_seen_at DESC`,
        [session.userId]
      );

      sendJson(res, 200, {
        sessions: rowsRes.rows.map(r => ({
          idPrefix: r.id.slice(0, 12),
          isCurrent: r.id === session.sessionId,
          userAgent: r.user_agent || 'Navegador desconocido',
          createdAt: r.created_at,
          lastSeenAt: r.last_seen_at,
          expiresAt: r.expires_at,
        })),
      });
      return;
    }

    if (req.method === 'DELETE') {
      const csrf = verifyCsrfProtection(req, session.csrfTokenHash);
      if (!csrf.ok) {
        sendJson(res, 403, { error: 'Token CSRF inválido.' });
        return;
      }

      const parsed = RevokeSchema.safeParse(parseJsonBody(req));
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Parámetros inválidos.' });
        return;
      }

      if (parsed.data.revokeAllOthers) {
        await revokeAllUserSessions(session.userId, session.sessionId);
        await recordSecurityEvent(req, 'session_revoked', session.userId, { scope: 'all_others' });
        sendJson(res, 200, { ok: true, message: 'Todas las demás sesiones fueron cerradas.' });
        return;
      }

      if (parsed.data.sessionIdPrefix) {
        const prefix12 = parsed.data.sessionIdPrefix.slice(0, 12);
        await query(
          `UPDATE user_sessions
           SET revoked_at = NOW()
           WHERE user_id = $1 AND LEFT(id, 12) = $2 AND id <> $3 AND revoked_at IS NULL`,
          [session.userId, prefix12, session.sessionId]
        );
        await recordSecurityEvent(req, 'session_revoked', session.userId, { scope: 'single' });
        sendJson(res, 200, { ok: true, message: 'Sesión cerrada correctamente.' });
        return;
      }

      sendJson(res, 400, { error: 'Especifica qué sesión revocar.' });
      return;
    }

    sendJson(res, 405, { error: 'Método no permitido.' });
  } catch (err) {
    console.error('[SESSIONS ERROR]', err);
    sendJson(res, 500, { error: 'Error interno al gestionar sesiones.' });
  }
}
