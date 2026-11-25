import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';
import { sendJson } from '../_lib/http.js';
import { getAuthenticatedSession } from '../_lib/session.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Método no permitido.' });
    return;
  }

  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      sendJson(res, 200, { authenticated: false, user: null });
      return;
    }

    const identitiesRes = await query<{ provider: string; email: string; email_verified: boolean; created_at: string }>(
      `SELECT provider, email, email_verified, created_at FROM user_identities WHERE user_id = $1`,
      [session.userId]
    );

    const consentRes = await query<{
      policy_version: string;
      accepted_marketing: boolean;
      consented_at: string;
    }>(
      `SELECT policy_version, accepted_marketing, consented_at
       FROM privacy_consents
       WHERE user_id = $1
       ORDER BY consented_at DESC
       LIMIT 1`,
      [session.userId]
    );

    sendJson(res, 200, {
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        emailVerified: session.emailVerified,
        fullName: session.fullName,
        avatarUrl: session.avatarUrl,
        role: session.role,
      },
      identities: identitiesRes.rows.map(i => ({
        provider: i.provider,
        email: i.email,
        emailVerified: i.email_verified,
        createdAt: i.created_at,
      })),
      latestConsent: consentRes.rows[0]
        ? {
            policyVersion: consentRes.rows[0].policy_version,
            acceptedMarketing: consentRes.rows[0].accepted_marketing,
            consentedAt: consentRes.rows[0].consented_at,
          }
        : null,
    });
  } catch (err) {
    // Graceful response when backend DB is not yet provisioned in local offline dev
    console.warn('[AUTH SESSION]', err);
    sendJson(res, 200, { authenticated: false, user: null, backendConfigured: false });
  }
}
