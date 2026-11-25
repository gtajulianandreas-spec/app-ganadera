import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendJson, verifyCsrfProtection } from '../_lib/http.js';
import { clearSessionCookies, getAuthenticatedSession, revokeSessionById } from '../_lib/session.js';
import { recordSecurityEvent } from '../_lib/audit.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Método no permitido.' });
    return;
  }

  try {
    const session = await getAuthenticatedSession(req);
    if (session) {
      const csrf = verifyCsrfProtection(req, session.csrfTokenHash);
      if (!csrf.ok) {
        sendJson(res, 403, { error: 'Token CSRF inválido.' });
        return;
      }
      await revokeSessionById(session.sessionId);
      await recordSecurityEvent(req, 'logout', session.userId);
    }

    clearSessionCookies(res);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error('[LOGOUT ERROR]', err);
    clearSessionCookies(res);
    sendJson(res, 500, { error: 'Error interno al cerrar sesión.' });
  }
}
