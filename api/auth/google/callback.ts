import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { query, withTransaction } from '../../_lib/db.js';
import { hashIp, sha256, timingSafeEqualHex } from '../../_lib/crypto.js';
import { getGoogleOAuthConfig, getPrivacyPolicyVersion, getServerPepper, isProduction } from '../../_lib/env.js';
import {
  appendSetCookie,
  getClientIp,
  getUserAgent,
  parseCookies,
  sanitizeRedirectPath,
  serializeCookie,
} from '../../_lib/http.js';
import { createSessionCookies } from '../../_lib/session.js';
import { recordSecurityEvent } from '../../_lib/audit.js';
import { OAUTH_STATE_COOKIE } from '../google.js';

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  appendSetCookie(
    res,
    serializeCookie(OAUTH_STATE_COOKIE, '', {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'Lax',
      maxAgeSeconds: 0,
    })
  );

  try {
    const errorParam = typeof req.query.error === 'string' ? req.query.error : null;
    if (errorParam) {
      await recordSecurityEvent(req, 'oauth_google_failed', null, { error: errorParam });
      res.redirect(302, '/?auth_error=cancelled');
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : null;
    const state = typeof req.query.state === 'string' ? req.query.state : null;
    const cookies = parseCookies(req);
    const cookieState = cookies[OAUTH_STATE_COOKIE];

    if (!code || !state || !cookieState || !timingSafeEqualHex(sha256(state), sha256(cookieState))) {
      await recordSecurityEvent(req, 'oauth_google_failed', null, { reason: 'invalid_state' });
      res.redirect(302, '/?auth_error=invalid_state');
      return;
    }

    const stateRes = await query<{
      code_verifier: string;
      nonce: string;
      redirect_to: string;
      consent_accepted: boolean;
      expires_at: Date;
    }>(
      `DELETE FROM oauth_states
       WHERE state_hash = $1
       RETURNING code_verifier, nonce, redirect_to, consent_accepted, expires_at`,
      [sha256(state)]
    );

    if (stateRes.rowCount === 0 || new Date(stateRes.rows[0].expires_at) <= new Date()) {
      await recordSecurityEvent(req, 'oauth_google_failed', null, { reason: 'expired_state' });
      res.redirect(302, '/?auth_error=expired_state');
      return;
    }

    const {
      code_verifier: codeVerifier,
      nonce: expectedNonce,
      redirect_to: rawRedirect,
      consent_accepted: consentAccepted,
    } = stateRes.rows[0];
    const redirectTo = sanitizeRedirectPath(rawRedirect);

    const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!tokenRes.ok) {
      await recordSecurityEvent(req, 'oauth_google_failed', null, { reason: 'token_exchange_failed' });
      res.redirect(302, '/?auth_error=oauth_failed');
      return;
    }

    const tokenData = (await tokenRes.json()) as { id_token?: string };
    if (!tokenData.id_token) {
      res.redirect(302, '/?auth_error=oauth_failed');
      return;
    }

    const { payload } = await jwtVerify(tokenData.id_token, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    });

    if (payload.nonce !== expectedNonce) {
      await recordSecurityEvent(req, 'oauth_google_failed', null, { reason: 'nonce_mismatch' });
      res.redirect(302, '/?auth_error=invalid_nonce');
      return;
    }

    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
    const emailVerified = payload.email_verified === true;
    const fullName = typeof payload.name === 'string' ? payload.name : 'Usuario Ganadero';
    const avatarUrl = typeof payload.picture === 'string' ? payload.picture : null;

    if (!sub || !email || !emailVerified) {
      await recordSecurityEvent(req, 'oauth_google_failed', null, { reason: 'unverified_google_email' });
      res.redirect(302, '/?auth_error=unverified_google_email');
      return;
    }

    const existingIdentity = await query<{ user_id: string; status: string; locked_until: Date | null }>(
      `SELECT ui.user_id, u.status, u.locked_until
       FROM user_identities ui
       INNER JOIN users u ON u.id = ui.user_id
       WHERE ui.provider = 'google' AND ui.provider_user_id = $1 AND u.deleted_at IS NULL`,
      [sub]
    );

    let userId: string;

    if (existingIdentity.rowCount && existingIdentity.rowCount > 0) {
      const idRow = existingIdentity.rows[0];
      if (idRow.status !== 'active' || (idRow.locked_until && new Date(idRow.locked_until) > new Date())) {
        res.redirect(302, '/?auth_error=account_unavailable');
        return;
      }
      userId = idRow.user_id;
      await query(`UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`, [userId]);
    } else {
      const existingUser = await query<{ id: string; email_verified: boolean; status: string; locked_until: Date | null }>(
        `SELECT id, email_verified, status, locked_until FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL`,
        [email]
      );

      if (existingUser.rowCount && existingUser.rowCount > 0) {
        const u = existingUser.rows[0];
        if (!u.email_verified) {
          await recordSecurityEvent(req, 'oauth_google_failed', u.id, { reason: 'unverified_local_link_blocked' });
          res.redirect(302, '/?auth_error=verify_existing_account_first');
          return;
        }
        if (u.status !== 'active' || (u.locked_until && new Date(u.locked_until) > new Date())) {
          res.redirect(302, '/?auth_error=account_unavailable');
          return;
        }
        userId = u.id;
        await withTransaction(async (client) => {
          await client.query(
            `INSERT INTO user_identities (user_id, provider, provider_user_id, email, email_verified)
             VALUES ($1, 'google', $2, $3, TRUE)`,
            [userId, sub, email]
          );
          await client.query(`UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`, [userId]);
        });
      } else {
        // Ley 1581/2012: new Google users must explicitly accept privacy consent before creating account
        if (!consentAccepted) {
          await recordSecurityEvent(req, 'oauth_google_failed', null, { reason: 'missing_privacy_consent' });
          res.redirect(302, '/?auth_error=consent_required');
          return;
        }

        const ipHash = hashIp(getClientIp(req), getServerPepper());
        const userAgent = getUserAgent(req);
        const policyVersion = getPrivacyPolicyVersion();

        userId = await withTransaction(async (client) => {
          const created = await client.query<{ id: string }>(
            `INSERT INTO users (email, email_verified, full_name, avatar_url, role, status, last_login_at)
             VALUES ($1, TRUE, $2, $3, 'admin', 'active', NOW())
             RETURNING id`,
            [email, fullName, avatarUrl]
          );
          const createdId = created.rows[0].id;
          await client.query(
            `INSERT INTO user_identities (user_id, provider, provider_user_id, email, email_verified)
             VALUES ($1, 'google', $2, $3, TRUE)`,
            [createdId, sub, email]
          );
          await client.query(
            `INSERT INTO privacy_consents (
               user_id, policy_version, accepted_privacy_policy, accepted_data_processing, accepted_marketing, ip_hash, user_agent
             ) VALUES ($1, $2, TRUE, TRUE, FALSE, $3, $4)`,
            [createdId, policyVersion, ipHash, userAgent]
          );
          return createdId;
        });
      }
    }

    await createSessionCookies(req, res, userId);
    await recordSecurityEvent(req, 'oauth_google_success', userId);
    res.redirect(302, redirectTo);
  } catch (err) {
    console.error('[GOOGLE CALLBACK ERROR]', err);
    await recordSecurityEvent(req, 'oauth_google_failed', null, { reason: 'verification_exception' });
    res.redirect(302, '/?auth_error=oauth_failed');
  }
}
