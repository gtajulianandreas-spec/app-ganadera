import type { VercelRequest, VercelResponse } from '@vercel/node';
import forgotPasswordHandler from '../_handlers/auth/forgot-password.js';
import googleHandler from '../_handlers/auth/google.js';
import googleCallbackHandler from '../_handlers/auth/google/callback.js';
import loginHandler from '../_handlers/auth/login.js';
import logoutHandler from '../_handlers/auth/logout.js';
import registerHandler from '../_handlers/auth/register.js';
import resetPasswordHandler from '../_handlers/auth/reset-password.js';
import sessionHandler from '../_handlers/auth/session.js';
import verifyEmailHandler from '../_handlers/auth/verify-email.js';
import { sendJson } from '../_lib/http.js';

const ROUTES: Record<string, (req: VercelRequest, res: VercelResponse) => Promise<void>> = {
  'forgot-password': forgotPasswordHandler,
  google: googleHandler,
  'google/callback': googleCallbackHandler,
  login: loginHandler,
  logout: logoutHandler,
  register: registerHandler,
  'reset-password': resetPasswordHandler,
  session: sessionHandler,
  'verify-email': verifyEmailHandler,
};

function resolveSlug(req: VercelRequest): string {
  const q = req.query.slug;
  if (Array.isArray(q) && q.length > 0) return q.join('/');
  if (typeof q === 'string' && q.length > 0) return q;
  const pathname = (req.url || '').split('?')[0];
  return pathname.replace(/^\/api\/auth\/?/, '').replace(/\/$/, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const routeKey = resolveSlug(req);
  const target = ROUTES[routeKey];
  if (!target) {
    sendJson(res, 404, { ok: false, error: 'Auth endpoint not found' });
    return;
  }
  await target(req, res);
}
