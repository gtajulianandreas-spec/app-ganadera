import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { query, withTransaction } from '../_lib/db.js';
import { generateSecureToken, hashIp, sha256, verifyPassword } from '../_lib/crypto.js';
import { getAppBaseUrl, getPrivacyPolicyVersion, getServerPepper } from '../_lib/env.js';
import { getClientIp, getUserAgent, parseJsonBody, sendJson, verifyCsrfProtection } from '../_lib/http.js';
import { checkRateLimit } from '../_lib/rateLimit.js';
import { clearSessionCookies, getAuthenticatedSession } from '../_lib/session.js';
import { sendTransactionalEmail } from '../_lib/email.js';
import { recordSecurityEvent } from '../_lib/audit.js';

const UpdateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  acceptedMarketing: z.boolean().optional(),
  newEmail: z.string().trim().email().max(254).optional(),
  currentPassword: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      sendJson(res, 401, { error: 'Sesión no válida.' });
      return;
    }

    const csrf = verifyCsrfProtection(req, session.csrfTokenHash);
    if (!csrf.ok) {
      sendJson(res, 403, { error: 'Token CSRF inválido.' });
      return;
    }

    if (req.method === 'PATCH') {
      const parsed = UpdateProfileSchema.safeParse(parseJsonBody(req));
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Datos de perfil inválidos.' });
        return;
      }

      const { fullName, acceptedMarketing, newEmail, currentPassword } = parsed.data;
      let emailChangeRequested = false;

      if (newEmail) {
        const normalized = newEmail.toLowerCase();
        if (normalized === session.email.toLowerCase()) {
          sendJson(res, 400, { error: 'El nuevo correo es igual a tu correo actual.' });
          return;
        }

        const rate = await checkRateLimit(`email_change:${session.userId}`, 3, 900, 1800);
        if (!rate.allowed) {
          sendJson(res, 429, { error: 'Demasiadas solicitudes de cambio de correo. Intenta más tarde.' });
          return;
        }

        // Re-authentication check if account has local password
        const pwIdentity = await query<{ password_hash: string | null }>(
          `SELECT password_hash FROM user_identities WHERE user_id = $1 AND provider = 'password'`,
          [session.userId]
        );
        const existingHash = pwIdentity.rows[0]?.password_hash;
        if (existingHash) {
          if (!currentPassword || !(await verifyPassword(existingHash, currentPassword))) {
            sendJson(res, 401, { error: 'Ingresa tu contraseña actual para autorizar el cambio de correo.' });
            return;
          }
        }

        const existingEmail = await query<{ id: string }>(
          `SELECT id FROM users WHERE LOWER(email) = $1 AND id <> $2 AND deleted_at IS NULL`,
          [normalized, session.userId]
        );
        if (existingEmail.rowCount && existingEmail.rowCount > 0) {
          sendJson(res, 409, { error: 'No se pudo procesar el cambio de correo. Usa otra dirección.' });
          return;
        }

        const rawToken = generateSecureToken(32);
        await withTransaction(async (client) => {
          await client.query(
            `UPDATE auth_tokens SET used_at = NOW() WHERE user_id = $1 AND type = 'email_change' AND used_at IS NULL`,
            [session.userId]
          );
          await client.query(
            `INSERT INTO auth_tokens (user_id, token_hash, type, target_email, expires_at)
             VALUES ($1, $2, 'email_change', $3, NOW() + interval '2 hours')`,
            [session.userId, sha256(rawToken), normalized]
          );
        });

        const confirmUrl = `${getAppBaseUrl()}/?verify_token=${encodeURIComponent(rawToken)}`;
        await sendTransactionalEmail({
          to: normalized,
          subject: 'Confirma tu nuevo correo en APP GANADERA',
          text: `Confirma el cambio de correo a ${normalized} ingresando a: ${confirmUrl}`,
          html: `<p>Confirma tu nueva dirección de correo electrónico en <strong>APP GANADERA</strong>:</p><p><a href="${confirmUrl}">Confirmar nuevo correo</a></p>`,
        });
        await recordSecurityEvent(req, 'email_change_requested', session.userId);
        emailChangeRequested = true;
      }

      if (fullName) {
        await query(`UPDATE users SET full_name = $2, updated_at = NOW() WHERE id = $1`, [session.userId, fullName]);
      }

      if (typeof acceptedMarketing === 'boolean') {
        await query(
          `INSERT INTO privacy_consents (
             user_id, policy_version, accepted_privacy_policy, accepted_data_processing, accepted_marketing, ip_hash, user_agent
           ) VALUES ($1, $2, TRUE, TRUE, $3, $4, $5)`,
          [
            session.userId,
            getPrivacyPolicyVersion(),
            acceptedMarketing,
            hashIp(getClientIp(req), getServerPepper()),
            getUserAgent(req),
          ]
        );
      }

      sendJson(res, 200, {
        ok: true,
        message: emailChangeRequested
          ? 'Perfil actualizado. Enviamos un enlace de verificación a tu nuevo correo.'
          : 'Perfil y preferencias actualizados.',
      });
      return;
    }

    if (req.method === 'DELETE') {
      const anonymizedEmail = `deleted_${session.userId}@anon.appganadera.local`;
      await withTransaction(async (client) => {
        await client.query(`UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`, [
          session.userId,
        ]);
        await client.query(`DELETE FROM user_identities WHERE user_id = $1`, [session.userId]);
        await client.query(`DELETE FROM auth_tokens WHERE user_id = $1`, [session.userId]);
        await client.query(
          `UPDATE users
           SET email = $2,
               email_verified = FALSE,
               full_name = 'Usuario Eliminado',
               avatar_url = NULL,
               status = 'deleted',
               deleted_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [session.userId, anonymizedEmail]
        );
      });

      await recordSecurityEvent(req, 'account_deleted', session.userId);
      clearSessionCookies(res);
      sendJson(res, 200, {
        ok: true,
        message: 'Tu cuenta y datos personales han sido eliminados/anonimizados conforme a la Ley 1581 de 2012.',
      });
      return;
    }

    sendJson(res, 405, { error: 'Método no permitido.' });
  } catch (err) {
    console.error('[PROFILE ERROR]', err);
    sendJson(res, 500, { error: 'Error interno al procesar la cuenta.' });
  }
}
