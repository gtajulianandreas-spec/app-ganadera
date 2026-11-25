import type { VercelRequest } from '@vercel/node';
import { query } from './db.js';
import { hashIp } from './crypto.js';
import { getServerPepper } from './env.js';
import { getClientIp, getUserAgent } from './http.js';

export type SecurityEventType =
  | 'register_success'
  | 'login_success'
  | 'login_failed'
  | 'login_locked'
  | 'logout'
  | 'oauth_google_success'
  | 'oauth_google_failed'
  | 'email_verified'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'password_changed'
  | 'email_change_requested'
  | 'email_changed'
  | 'session_revoked'
  | 'account_deleted';

export async function recordSecurityEvent(
  req: VercelRequest,
  eventType: SecurityEventType,
  userId: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const ipHash = hashIp(getClientIp(req), getServerPepper());
    const userAgent = getUserAgent(req);
    await query(
      `INSERT INTO security_audit_logs (user_id, event_type, ip_hash, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [userId, eventType, ipHash, userAgent, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', eventType, err);
  }
}
