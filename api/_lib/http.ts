import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllowedOrigins, isProduction } from './env.js';
import { sha256, timingSafeEqualHex } from './crypto.js';

export function sendJson(res: VercelResponse, status: number, payload: unknown): void {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(status).json(payload);
}

export function getClientIp(req: VercelRequest): string {
  const vercelIp = req.headers['x-vercel-forwarded-for'] || req.headers['x-real-ip'];
  if (typeof vercelIp === 'string' && vercelIp.length > 0) {
    return vercelIp.split(',')[0].trim();
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function getUserAgent(req: VercelRequest): string {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua.slice(0, 300) : 'unknown';
}

export function parseCookies(req: VercelRequest): Record<string, string> {
  const raw = req.headers.cookie;
  if (!raw) return {};
  const result: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  path?: string;
  maxAgeSeconds?: number;
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`);
  }
  if (options.httpOnly !== false) {
    parts.push('HttpOnly');
  }
  if (options.secure ?? isProduction()) {
    parts.push('Secure');
  }
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);
  return parts.join('; ');
}

export function appendSetCookie(res: VercelResponse, cookieString: string): void {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', [cookieString]);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookieString]);
  } else {
    res.setHeader('Set-Cookie', [String(existing), cookieString]);
  }
}

/**
 * Validates Origin/Referer against APP_BASE_URL and optionally validates double-submit CSRF token.
 */
export function verifyCsrfProtection(
  req: VercelRequest,
  expectedCsrfTokenHash?: string
): { ok: boolean; reason?: string } {
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin) {
    if (!allowedOrigins.includes(origin)) {
      return { ok: false, reason: 'Origin mismatch' };
    }
  } else if (referer) {
    try {
      if (!allowedOrigins.includes(new URL(referer).origin)) {
        return { ok: false, reason: 'Referer mismatch' };
      }
    } catch {
      return { ok: false, reason: 'Invalid referer' };
    }
  } else if (isProduction()) {
    return { ok: false, reason: 'Missing Origin/Referer' };
  }

  if (expectedCsrfTokenHash) {
    const headerToken = req.headers['x-csrf-token'];
    const tokenValue = Array.isArray(headerToken) ? headerToken[0] : headerToken;
    if (!tokenValue || !timingSafeEqualHex(sha256(tokenValue), expectedCsrfTokenHash)) {
      return { ok: false, reason: 'Invalid CSRF token' };
    }
  }

  return { ok: true };
}

/**
 * Prevents Open Redirect vulnerabilities: only permits relative internal paths starting with single `/`.
 */
export function sanitizeRedirectPath(raw: unknown): string {
  if (typeof raw !== 'string') return '/';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return '/';
  }
  return trimmed;
}

export function parseJsonBody<T = Record<string, unknown>>(req: VercelRequest): T {
  if (!req.body) return {} as T;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }
  return req.body as T;
}
