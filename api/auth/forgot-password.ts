import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { query, withTransaction } from '../_lib/db.js';
import { escapeHtml, generateSecureToken, hashIp, sha256 } from '../_lib/crypto.js';
import { getAppBaseUrl, getServerPepper } from '../_lib/env.js';
import { getClientIp, parseJsonBody, sendJson, verifyCsrfProtection } from '../_lib/http.js';
import { checkRateLimit } from '../_lib/rateLimit.js';
import { sendTransactionalEmail } from '../_lib/email.js';
import { recordSecurityEvent } from '../_lib/audit.js';

const ForgotSchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido.').max(254),
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

    const parsed = ForgotSchema.safeParse(parseJsonBody(req));
    if (!parsed.success) {
      sendJson(res, 400, { error: 'Ingresa un correo electrónico válido.' });
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const emailHash = sha256(email);
    const ipHash = hashIp(getClientIp(req), getServerPepper());

    // Dual rate limiting: prevents both IP flooding and targeted inbox bombing
    const ipRate = await checkRateLimit(`forgot_ip:${ipHash}`, 10, 900, 1800);
    const emailRate = await checkRateLimit(`forgot_email:${emailHash}`, 3, 900, 1800);

    if (!ipRate.allowed || !emailRate.allowed) {
      const retryAfter = Math.max(ipRate.retryAfterSeconds, emailRate.retryAfterSeconds);
      res.setHeader('Retry-After', String(retryAfter));
      sendJson(res, 429, { error: 'Demasiadas solicitudes de recuperación. Intenta más tarde.' });
      return;
    }

    const genericResponse = {
      ok: true,
      message:
        'Si el correo está asociado a una cuenta activa, recibirás instrucciones para restablecer tu contraseña.',
    };

    const userRes = await query<{ id: string; full_name: string }>(
      `SELECT id, full_name FROM users WHERE LOWER(email) = $1 AND status = 'active' AND deleted_at IS NULL`,
      [email]
    );

    if (userRes.rowCount && userRes.rowCount > 0) {
      const user = userRes.rows[0];
      const rawToken = generateSecureToken(32);

      await withTransaction(async (client) => {
        await client.query(
          `UPDATE auth_tokens SET used_at = NOW() WHERE user_id = $1 AND type = 'password_reset' AND used_at IS NULL`,
          [user.id]
        );
        await client.query(
          `INSERT INTO auth_tokens (user_id, token_hash, type, expires_at)
           VALUES ($1, $2, 'password_reset', NOW() + interval '30 minutes')`,
          [user.id, sha256(rawToken)]
        );
      });

      const resetUrl = `${getAppBaseUrl()}/?reset_token=${encodeURIComponent(rawToken)}`;
      const safeName = escapeHtml(user.full_name);
      await sendTransactionalEmail({
        to: email,
        subject: 'Restablecimiento de contraseña - APP GANADERA',
        text: `Hola ${user.full_name}, restablece tu contraseña en: ${resetUrl} (válido por 30 minutos). Si no lo solicitaste, ignora este mensaje.`,
        html: `<p>Hola <strong>${safeName}</strong>,</p><p>Recibimos una solicitud para restablecer tu contraseña:</p><p><a href="${resetUrl}">Restablecer contraseña</a></p><p>Este enlace es de un solo uso y expira en <strong>30 minutos</strong>.</p>`,
      });

      await recordSecurityEvent(req, 'password_reset_requested', user.id);
    }

    sendJson(res, 200, genericResponse);
  } catch (err) {
    console.error('[FORGOT PASSWORD ERROR]', err);
    sendJson(res, 500, { error: 'Error interno al procesar la recuperación.' });
  }
}
