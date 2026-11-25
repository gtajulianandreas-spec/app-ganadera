import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { query, withTransaction } from '../_lib/db.js';
import {
  escapeHtml,
  generateSecureToken,
  hashIp,
  sha256,
  validateAndHashNewPassword,
} from '../_lib/crypto.js';
import { getAppBaseUrl, getPrivacyPolicyVersion, getServerPepper } from '../_lib/env.js';
import { getClientIp, getUserAgent, parseJsonBody, sendJson, verifyCsrfProtection } from '../_lib/http.js';
import { checkRateLimit } from '../_lib/rateLimit.js';
import { sendTransactionalEmail } from '../_lib/email.js';
import { recordSecurityEvent } from '../_lib/audit.js';

const RegisterSchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido.').max(254),
  password: z.string().min(10, 'La contraseña debe tener al menos 10 caracteres.').max(128),
  fullName: z.string().trim().min(2, 'Ingresa tu nombre completo.').max(120),
  acceptedPrivacyPolicy: z.literal(true, {
    message: 'Debes aceptar expresamente la Política de Privacidad.',
  }),
  acceptedDataProcessing: z.literal(true, {
    message: 'Debes autorizar el tratamiento de datos personales (Ley 1581/2012).',
  }),
  acceptedMarketing: z.boolean().optional().default(false),
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
    const rate = await checkRateLimit(`register:${ipHash}`, 5, 900, 1800);
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfterSeconds));
      sendJson(res, 429, { error: 'Demasiados intentos de registro. Intenta nuevamente más tarde.' });
      return;
    }

    const parsed = RegisterSchema.safeParse(parseJsonBody(req));
    if (!parsed.success) {
      sendJson(res, 400, {
        error: parsed.error.issues[0]?.message || 'Datos de registro inválidos.',
      });
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const { password, fullName, acceptedMarketing } = parsed.data;

    const pwResult = await validateAndHashNewPassword(password);
    if (!pwResult.ok) {
      sendJson(res, 400, { error: pwResult.error });
      return;
    }

    // Constant-time anti-enumeration: password was already hashed above before checking existing email
    const existing = await query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL`,
      [email]
    );

    const genericMessage =
      'Si el correo proporcionado es válido y no estaba registrado, recibirás un enlace de confirmación para activar tu cuenta.';

    if (existing.rowCount && existing.rowCount > 0) {
      await sendTransactionalEmail({
        to: email,
        subject: 'Intento de registro en APP GANADERA',
        text: `Se intentó registrar una cuenta con este correo en APP GANADERA. Si fuiste tú, inicia sesión o recupera tu contraseña en ${getAppBaseUrl()}.`,
        html: `<p>Se intentó registrar una cuenta con este correo en <strong>APP GANADERA</strong>.</p><p>Si ya tienes cuenta, puedes iniciar sesión o restablecer tu contraseña en <a href="${getAppBaseUrl()}">${getAppBaseUrl()}</a>.</p>`,
      });
      sendJson(res, 200, { ok: true, message: genericMessage });
      return;
    }

    const rawToken = generateSecureToken(32);
    const tokenHash = sha256(rawToken);
    const policyVersion = getPrivacyPolicyVersion();
    const userAgent = getUserAgent(req);

    const userId = await withTransaction(async (client) => {
      const userRes = await client.query<{ id: string }>(
        `INSERT INTO users (email, email_verified, full_name, role, status, password_changed_at)
         VALUES ($1, FALSE, $2, 'admin', 'active', NOW())
         RETURNING id`,
        [email, fullName]
      );
      const createdUserId = userRes.rows[0].id;

      await client.query(
        `INSERT INTO user_identities (user_id, provider, provider_user_id, email, email_verified, password_hash)
         VALUES ($1, 'password', $2, $2, FALSE, $3)`,
        [createdUserId, email, pwResult.hash]
      );

      await client.query(
        `INSERT INTO privacy_consents (
           user_id, policy_version, accepted_privacy_policy, accepted_data_processing, accepted_marketing, ip_hash, user_agent
         ) VALUES ($1, $2, TRUE, TRUE, $3, $4, $5)`,
        [createdUserId, policyVersion, acceptedMarketing, ipHash, userAgent]
      );

      await client.query(
        `INSERT INTO auth_tokens (user_id, token_hash, type, expires_at)
         VALUES ($1, $2, 'email_verification', NOW() + interval '24 hours')`,
        [createdUserId, tokenHash]
      );

      return createdUserId;
    });

    const verifyUrl = `${getAppBaseUrl()}/?verify_token=${encodeURIComponent(rawToken)}`;
    const safeName = escapeHtml(fullName);
    await sendTransactionalEmail({
      to: email,
      subject: 'Confirma tu correo en APP GANADERA',
      text: `Hola ${fullName}, confirma tu correo ingresando a: ${verifyUrl} (expira en 24 horas).`,
      html: `<p>Hola <strong>${safeName}</strong>,</p><p>Confirma tu dirección de correo electrónico para activar tu cuenta en <strong>APP GANADERA</strong>:</p><p><a href="${verifyUrl}">Confirmar correo electrónico</a></p><p>Este enlace es de un solo uso y expira en 24 horas.</p>`,
    });

    await recordSecurityEvent(req, 'register_success', userId, { method: 'password', policyVersion });
    sendJson(res, 200, { ok: true, message: genericMessage });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    sendJson(res, 500, { error: 'Error interno al procesar el registro.' });
  }
}
