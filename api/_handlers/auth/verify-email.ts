import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { withTransaction } from '../../_lib/db.js';
import { hashIp, sha256 } from '../../_lib/crypto.js';
import { getServerPepper } from '../../_lib/env.js';
import { getClientIp, parseJsonBody, sendJson, verifyCsrfProtection } from '../../_lib/http.js';
import { checkRateLimit } from '../../_lib/rateLimit.js';
import { revokeAllUserSessions } from '../../_lib/session.js';
import { recordSecurityEvent } from '../../_lib/audit.js';

const VerifySchema = z.object({
  token: z.string().min(16, 'Token inválido.').max(256),
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

    const ipHash = hashIp(getClientIp(req), getServerPepper());
    const rate = await checkRateLimit(`verify_email:${ipHash}`, 15, 900, 1800);
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfterSeconds));
      sendJson(res, 429, { error: 'Demasiados intentos de verificación. Intenta más tarde.' });
      return;
    }

    const parsed = VerifySchema.safeParse(parseJsonBody(req));
    if (!parsed.success) {
      sendJson(res, 400, { error: 'El enlace de verificación es inválido o está incompleto.' });
      return;
    }

    const tokenHash = sha256(parsed.data.token);

    const outcome = await withTransaction(async (client) => {
      const tokenRes = await client.query<{
        id: string;
        user_id: string;
        type: string;
        target_email: string | null;
      }>(
        `UPDATE auth_tokens
         SET used_at = NOW()
         WHERE token_hash = $1
           AND type IN ('email_verification', 'email_change')
           AND used_at IS NULL
           AND expires_at > NOW()
         RETURNING id, user_id, type, target_email`,
        [tokenHash]
      );

      if (tokenRes.rowCount === 0) {
        return { status: 'invalid' as const };
      }

      const { user_id: userId, type, target_email: targetEmail } = tokenRes.rows[0];

      if (type === 'email_change' && targetEmail) {
        const conflict = await client.query<{ id: string }>(
          `SELECT id FROM users WHERE LOWER(email) = $1 AND id <> $2 AND deleted_at IS NULL`,
          [targetEmail.toLowerCase(), userId]
        );
        if (conflict.rowCount && conflict.rowCount > 0) {
          return { status: 'email_taken' as const };
        }

        await client.query(`UPDATE users SET email = $2, email_verified = TRUE, updated_at = NOW() WHERE id = $1`, [
          userId,
          targetEmail.toLowerCase(),
        ]);
        // Only update local password identity; never overwrite Google OIDC identity email
        await client.query(
          `UPDATE user_identities
           SET email = $2, provider_user_id = $2, email_verified = TRUE, updated_at = NOW()
           WHERE user_id = $1 AND provider = 'password'`,
          [userId, targetEmail.toLowerCase()]
        );
        return { status: 'email_changed' as const, userId };
      }

      await client.query(`UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1`, [userId]);
      await client.query(`UPDATE user_identities SET email_verified = TRUE, updated_at = NOW() WHERE user_id = $1`, [
        userId,
      ]);
      return { status: 'email_verified' as const, userId };
    });

    if (outcome.status === 'invalid') {
      sendJson(res, 400, { error: 'El enlace de verificación es inválido, expiró o ya fue utilizado.' });
      return;
    }
    if (outcome.status === 'email_taken') {
      sendJson(res, 409, { error: 'Ese correo electrónico ya está asociado a otra cuenta.' });
      return;
    }

    if (outcome.status === 'email_changed') {
      await revokeAllUserSessions(outcome.userId);
      await recordSecurityEvent(req, 'email_changed', outcome.userId);
      sendJson(res, 200, { ok: true, message: 'Correo electrónico actualizado. Inicia sesión nuevamente.' });
      return;
    }

    await recordSecurityEvent(req, 'email_verified', outcome.userId);
    sendJson(res, 200, { ok: true, message: 'Correo electrónico confirmado. Ya puedes iniciar sesión.' });
  } catch (err) {
    console.error('[VERIFY EMAIL ERROR]', err);
    sendJson(res, 500, { error: 'Error interno al verificar el correo.' });
  }
}
