import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { query } from '../../_lib/db.js';
import { hashIp, sha256, verifyPassword } from '../../_lib/crypto.js';
import { getServerPepper } from '../../_lib/env.js';
import { getClientIp, parseJsonBody, sendJson, verifyCsrfProtection } from '../../_lib/http.js';
import { checkRateLimit, resetRateLimit } from '../../_lib/rateLimit.js';
import { createSessionCookies } from '../../_lib/session.js';
import { recordSecurityEvent } from '../../_lib/audit.js';

const LoginSchema = z.object({
  email: z.string().trim().email('Correo inválido.').max(254),
  password: z.string().min(1, 'Ingresa tu contraseña.').max(128),
});

const DUMMY_ARGON2_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const MAX_FAILED_ATTEMPTS = 5;

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

    const parsed = LoginSchema.safeParse(parseJsonBody(req));
    if (!parsed.success) {
      sendJson(res, 400, { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const { password } = parsed.data;
    const ipHash = hashIp(getClientIp(req), getServerPepper());

    // Dual rate limiting: IP-only (credential stuffing) + IP:email (brute force)
    const ipRate = await checkRateLimit(`login_ip:${ipHash}`, 30, 300, 900);
    const pairRateKey = `login:${ipHash}:${sha256(email)}`;
    const pairRate = await checkRateLimit(pairRateKey, 10, 300, 900);

    if (!ipRate.allowed || !pairRate.allowed) {
      const retryAfter = Math.max(ipRate.retryAfterSeconds, pairRate.retryAfterSeconds);
      res.setHeader('Retry-After', String(retryAfter));
      sendJson(res, 429, {
        error: 'Demasiados intentos fallidos. Por seguridad, espera unos minutos antes de intentar de nuevo.',
      });
      return;
    }

    const userRes = await query<{
      id: string;
      email: string;
      email_verified: boolean;
      full_name: string;
      avatar_url: string | null;
      role: string;
      status: string;
      locked_until: Date | null;
      password_hash: string | null;
    }>(
      `SELECT u.id, u.email, u.email_verified, u.full_name, u.avatar_url, u.role, u.status,
              u.locked_until, ui.password_hash
       FROM users u
       LEFT JOIN user_identities ui ON ui.user_id = u.id AND ui.provider = 'password'
       WHERE LOWER(u.email) = $1 AND u.deleted_at IS NULL`,
      [email]
    );

    const user = userRes.rows[0];

    if (!user || !user.password_hash) {
      await verifyPassword(DUMMY_ARGON2_HASH, password);
      await recordSecurityEvent(req, 'login_failed', null, { reason: 'unknown_or_no_password' });
      sendJson(res, 401, { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
      return;
    }

    // Always run verifyPassword before checking lock state to avoid pre-auth timing/status leaks
    const validPassword = await verifyPassword(user.password_hash, password);
    const isLocked = user.locked_until !== null && new Date(user.locked_until) > new Date();

    if (user.status !== 'active' || isLocked) {
      await recordSecurityEvent(req, 'login_locked', user.id);
      sendJson(res, 429, {
        error: 'Cuenta temporalmente bloqueada por seguridad. Intenta más tarde o restablece tu contraseña.',
      });
      return;
    }

    if (!validPassword) {
      // Atomic SQL increment + reset if prior lock already expired
      await query(
        `UPDATE users
         SET failed_login_attempts = CASE
               WHEN locked_until IS NOT NULL AND locked_until <= NOW() THEN 1
               ELSE failed_login_attempts + 1
             END,
             locked_until = CASE
               WHEN (CASE WHEN locked_until IS NOT NULL AND locked_until <= NOW() THEN 1 ELSE failed_login_attempts + 1 END) >= $2
                 THEN NOW() + interval '15 minutes'
               ELSE NULL
             END,
             updated_at = NOW()
         WHERE id = $1`,
        [user.id, MAX_FAILED_ATTEMPTS]
      );
      await recordSecurityEvent(req, 'login_failed', user.id);
      sendJson(res, 401, { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
      return;
    }

    if (!user.email_verified) {
      sendJson(res, 403, {
        code: 'EMAIL_NOT_VERIFIED',
        error: 'Debes confirmar tu dirección de correo electrónico antes de iniciar sesión.',
      });
      return;
    }

    await resetRateLimit(pairRateKey);
    await query(
      `UPDATE users
       SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    await createSessionCookies(req, res, user.id);
    await recordSecurityEvent(req, 'login_success', user.id, { method: 'password' });

    sendJson(res, 200, {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    sendJson(res, 500, { error: 'Error interno al iniciar sesión.' });
  }
}
