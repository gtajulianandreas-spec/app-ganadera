import type { VercelRequest, VercelResponse } from '@vercel/node';
import changePasswordHandler from '../_handlers/account/change-password.js';
import profileHandler from '../_handlers/account/profile.js';
import sessionsHandler from '../_handlers/account/sessions.js';
import { sendJson } from '../_lib/http.js';

const ROUTES: Record<string, (req: VercelRequest, res: VercelResponse) => Promise<void>> = {
  'change-password': changePasswordHandler,
  profile: profileHandler,
  sessions: sessionsHandler,
};

function resolveAction(req: VercelRequest): string {
  const q = req.query.action;
  if (Array.isArray(q) && q.length > 0) return q[0];
  if (typeof q === 'string' && q.length > 0) return q;
  const pathname = (req.url || '').split('?')[0];
  return pathname.replace(/^\/api\/account\/?/, '').replace(/\/$/, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const action = resolveAction(req);
  const target = ROUTES[action];
  if (!target) {
    sendJson(res, 404, { ok: false, error: 'Account endpoint not found' });
    return;
  }
  await target(req, res);
}
