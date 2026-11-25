import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db.js';
import { generateSecureToken, sha256, hashIp } from './crypto.js';
import { appendSetCookie, getClientIp, getUserAgent, parseCookies, serializeCookie } from './http.js';
import { getServerPepper, isProduction } from './env.js';

export const SESSION_COOKIE_NAME = 'ag_session';
export const CSRF_COOKIE_NAME = 'ag_csrf';

export const IDLE_TIMEOUT_SECONDS = 7 * 24 * 60 * 60; // 7 days sliding inactivity
export const MAX_SESSION_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days absolute max

export interface AuthenticatedSession {
  sessionId: string;
  userId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  csrfTokenHash: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

export async function createSessionCookies(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
): Promise<{ sessionId: string; csrfToken: string }> {
  const rawSessionToken = generateSecureToken(32);
  const rawCsrfToken = generateSecureToken(24);
  const sessionId = sha256(rawSessionToken);
  const csrfTokenHash = sha256(rawCsrfToken);
  const ipHash = hashIp(getClientIp(req), getServerPepper());
  const userAgent = getUserAgent(req);

  await query(
    `INSERT INTO user_sessions (
       id, user_id, csrf_token_hash, ip_hash, user_agent, idle_expires_at, expires_at
     ) VALUES (
       $1, $2, $3, $4, $5,
       NOW() + ($6 || ' seconds')::interval,
       NOW() + ($7 || ' seconds')::interval
     )`,
    [sessionId, userId, csrfTokenHash, ipHash, userAgent, IDLE_TIMEOUT_SECONDS, MAX_SESSION_AGE_SECONDS]
  );

  appendSetCookie(
    res,
    serializeCookie(SESSION_COOKIE_NAME, rawSessionToken, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'Lax',
      maxAgeSeconds: MAX_SESSION_AGE_SECONDS,
    })
  );

  appendSetCookie(
    res,
    serializeCookie(CSRF_COOKIE_NAME, rawCsrfToken, {
      httpOnly: false, // Readable by SPA to attach X-CSRF-Token header
      secure: isProduction(),
      sameSite: 'Lax',
      maxAgeSeconds: MAX_SESSION_AGE_SECONDS,
    })
  );

  return { sessionId, csrfToken: rawCsrfToken };
}

export function clearSessionCookies(res: VercelResponse): void {
  appendSetCookie(
    res,
    serializeCookie(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'Lax',
      maxAgeSeconds: 0,
    })
  );
  appendSetCookie(
    res,
    serializeCookie(CSRF_COOKIE_NAME, '', {
      httpOnly: false,
      secure: isProduction(),
      sameSite: 'Lax',
      maxAgeSeconds: 0,
    })
  );
}

export async function getAuthenticatedSession(req: VercelRequest): Promise<AuthenticatedSession | null> {
  const cookies = parseCookies(req);
  const rawToken = cookies[SESSION_COOKIE_NAME];
  if (!rawToken) return null;

  const sessionId = sha256(rawToken);
  const res = await query<{
    session_id: string;
    user_id: string;
    email: string;
    email_verified: boolean;
    full_name: string;
    avatar_url: string | null;
    role: string;
    status: string;
    csrf_token_hash: string;
    created_at: string;
    last_seen_at: string;
    expires_at: string;
  }>(
    `SELECT s.id AS session_id, s.user_id, s.csrf_token_hash, s.created_at, s.last_seen_at, s.expires_at,
            u.email, u.email_verified, u.full_name, u.avatar_url, u.role, u.status
     FROM user_sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.id = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > NOW()
       AND s.idle_expires_at > NOW()
       AND u.status = 'active'
       AND u.deleted_at IS NULL`,
    [sessionId]
  );

  if (res.rowCount === 0) return null;
  const row = res.rows[0];

  // Throttled sliding inactivity refresh (max once every 5 minutes per session)
  await query(
    `UPDATE user_sessions
     SET last_seen_at = NOW(),
         idle_expires_at = LEAST(expires_at, NOW() + ($2 || ' seconds')::interval)
     WHERE id = $1
       AND last_seen_at < NOW() - interval '5 minutes'`,
    [sessionId, IDLE_TIMEOUT_SECONDS]
  );

  return {
    sessionId: row.session_id,
    userId: row.user_id,
    email: row.email,
    emailVerified: row.email_verified,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    status: row.status,
    csrfTokenHash: row.csrf_token_hash,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    expiresAt: row.expires_at,
  };
}

export async function revokeSessionById(sessionId: string): Promise<void> {
  await query(`UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1`, [sessionId]);
}

export async function revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
  if (exceptSessionId) {
    await query(
      `UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND id <> $2 AND revoked_at IS NULL`,
      [userId, exceptSessionId]
    );
  } else {
    await query(
      `UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  }
}
