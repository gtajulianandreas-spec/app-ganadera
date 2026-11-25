import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as oauth from 'oauth4webapi';
import { query } from '../../_lib/db.js';
import { generateSecureToken, hashIp, sha256 } from '../../_lib/crypto.js';
import { getGoogleOAuthConfig, getServerPepper, isProduction } from '../../_lib/env.js';
import { appendSetCookie, getClientIp, sanitizeRedirectPath, sendJson, serializeCookie } from '../../_lib/http.js';
import { checkRateLimit } from '../../_lib/rateLimit.js';

export const OAUTH_STATE_COOKIE = 'ag_oauth_state';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Método no permitido.' });
    return;
  }

  try {
    const ipHash = hashIp(getClientIp(req), getServerPepper());
    const rate = await checkRateLimit(`oauth_init:${ipHash}`, 20, 300, 600);
    if (!rate.allowed) {
      res.redirect(302, '/?auth_error=rate_limited');
      return;
    }

    const { clientId, redirectUri } = getGoogleOAuthConfig();
    const state = generateSecureToken(32);
    const nonce = generateSecureToken(32);
    const codeVerifier = oauth.generateRandomCodeVerifier();
    const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
    const redirectTo = sanitizeRedirectPath(req.query.redirect);
    const consentAccepted = req.query.consent === '1';

    await query(
      `INSERT INTO oauth_states (state_hash, code_verifier, nonce, redirect_to, consent_accepted, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + interval '10 minutes')`,
      [sha256(state), codeVerifier, nonce, redirectTo, consentAccepted]
    );

    appendSetCookie(
      res,
      serializeCookie(OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        secure: isProduction(),
        sameSite: 'Lax',
        maxAgeSeconds: 600,
      })
    );

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('prompt', 'select_account');

    res.redirect(302, authUrl.toString());
  } catch (err) {
    console.error('[GOOGLE OAUTH INIT ERROR]', err);
    res.redirect(302, '/?auth_error=oauth_unavailable');
  }
}
