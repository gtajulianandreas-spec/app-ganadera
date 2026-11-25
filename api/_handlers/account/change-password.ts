import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { query, withTransaction } from '../../_lib/db.js';
import { validateAndHashNewPassword, verifyPassword } from '../../_lib/crypto.js';
import { parseJsonBody, sendJson, verifyCsrfProtection } from '../../_lib/http.js';
import { checkRateLimit } from '../../_lib/rateLimit.js';
import { createSessionCookies, getAuthenticatedSession } from '../../_lib/session.js';
import { recordSecurityEvent } from '../../_lib/audit.js';

const ChangePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(10, 'La nueva contraseña debe tener al menos 10 caracteres.').max(128),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Método no permitido.' });
    return;
  }

  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      sendJson(res, 401, { error: 'Sesión no válida o expirada.' });
      return;
    }

    const csrf = verifyCsrfProtection(req, session.csrfTokenHash);
    if (!csrf.ok) {
      sendJson(res, 403, { error: 'Token CSRF inválido.' });
      return;
    }

    const rate = await checkRateLimit(`change_pw:${session.userId}`, 5, 900, 1800);
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfterSeconds));
      sendJson(res, 429, { error: 'Demasiados intentos de cambio de contraseña. Intenta más tarde.' });
      return;
    }

    const parsed = ChangePasswordSchema.safeParse(parseJsonBody(req));
    if (!parsed.success) {
      sendJson(res, 400, { error: parsed.error.issues[0]?.message || 'Datos inválidos.' });
      return;
    }

    const { currentPassword, newPassword } = parsed.data;
    const identityRes = await query<{ password_hash: string | null }>(
      `SELECT password_hash FROM user_identities WHERE user_id = $1 AND provider = 'password'`,
      [session.userId]
    );

    const existingHash = identityRes.rows[0]?.password_hash;
    if (existingHash) {
      if (!currentPassword || !(await verifyPassword(existingHash, currentPassword))) {
        sendJson(res, 401, { error: 'La contraseña actual es incorrecta.' });
        return;
      }
    }

    const pwResult = await validateAndHashNewPassword(newPassword);
    if (!pwResult.ok) {
      sendJson(res, 400, { error: pwResult.error });
      return;
    }

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO user_identities (user_id, provider, provider_user_id, email, email_verified, password_hash)
         VALUES ($1, 'password', $2, $2, TRUE, $3)
         ON CONFLICT (user_id, provider)
         DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
        [session.userId, session.email, pwResult.hash]
      );
      await client.query(`UPDATE users SET password_changed_at = NOW(), updated_at = NOW() WHERE id = $1`, [
        session.userId,
      ]);
      await client.query(
        `UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
        [session.userId]
      );
    });

    await createSessionCookies(req, res, session.userId);
    await recordSecurityEvent(req, 'password_changed', session.userId);

    sendJson(res, 200, { ok: true, message: 'Contraseña actualizada y otras sesiones cerradas por seguridad.' });
  } catch (err) {
    console.error('[CHANGE PASSWORD ERROR]', err);
    sendJson(res, 500, { error: 'Error interno al actualizar la contraseña.' });
  }
}
