import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { withTransaction } from '../../_lib/db.js';
import { sha256, validateAndHashNewPassword } from '../../_lib/crypto.js';
import { parseJsonBody, sendJson, verifyCsrfProtection } from '../../_lib/http.js';
import { recordSecurityEvent } from '../../_lib/audit.js';

const ResetSchema = z.object({
  token: z.string().min(16, 'Token inválido.').max(256),
  newPassword: z.string().min(10, 'La contraseña debe tener al menos 10 caracteres.').max(128),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Método no permitido.' });
    return;
  }

  try {
    const csrf = verifyCsrfProtection(req);
    if (!csrf.ok) {
      sendJson(res, 403, { error: 'Solicitud rechazada por política de seguridad.' });
      return;
    }

    const parsed = ResetSchema.safeParse(parseJsonBody(req));
    if (!parsed.success) {
      sendJson(res, 400, { error: parsed.error.issues[0]?.message || 'Datos inválidos.' });
      return;
    }

    const { token, newPassword } = parsed.data;
    const pwResult = await validateAndHashNewPassword(newPassword);
    if (!pwResult.ok) {
      sendJson(res, 400, { error: pwResult.error });
      return;
    }

    const userId = await withTransaction(async (client) => {
      const tokenRes = await client.query<{ user_id: string; email: string }>(
        `UPDATE auth_tokens t
         SET used_at = NOW()
         FROM users u
         WHERE t.token_hash = $1
           AND t.type = 'password_reset'
           AND t.used_at IS NULL
           AND t.expires_at > NOW()
           AND u.id = t.user_id
           AND u.deleted_at IS NULL
         RETURNING t.user_id, u.email`,
        [sha256(token)]
      );

      if (tokenRes.rowCount === 0) {
        return null;
      }

      const { user_id: targetUserId, email } = tokenRes.rows[0];

      await client.query(
        `INSERT INTO user_identities (user_id, provider, provider_user_id, email, email_verified, password_hash)
         VALUES ($1, 'password', $2, $2, TRUE, $3)
         ON CONFLICT (user_id, provider)
         DO UPDATE SET password_hash = EXCLUDED.password_hash, email_verified = TRUE, updated_at = NOW()`,
        [targetUserId, email, pwResult.hash]
      );

      // Possession of reset link sent to email also verifies email ownership
      await client.query(
        `UPDATE users
         SET email_verified = TRUE,
             password_changed_at = NOW(),
             failed_login_attempts = 0,
             locked_until = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [targetUserId]
      );

      await client.query(
        `UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
        [targetUserId]
      );

      return targetUserId;
    });

    if (!userId) {
      sendJson(res, 400, { error: 'El enlace de restablecimiento es inválido, expiró o ya fue utilizado.' });
      return;
    }

    await recordSecurityEvent(req, 'password_reset_completed', userId);
    sendJson(res, 200, {
      ok: true,
      message: 'Contraseña restablecida con éxito. Todas las sesiones anteriores fueron cerradas por seguridad.',
    });
  } catch (err) {
    console.error('[RESET PASSWORD ERROR]', err);
    sendJson(res, 500, { error: 'Error interno al restablecer la contraseña.' });
  }
}
