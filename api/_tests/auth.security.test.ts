import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
  generateSecureToken,
  sha256,
  hashIp,
  timingSafeEqualHex,
} from '../_lib/crypto.js';
import { sanitizeRedirectPath, verifyCsrfProtection } from '../_lib/http.js';
import { checkInMemoryRateLimit } from '../_lib/rateLimit.js';

describe('Security Controls & Cryptographic Primitives (OWASP ASVS / NIST 800-63B)', () => {
  it('hashes passwords with Argon2id and never stores plaintext', async () => {
    const secret = 'mi finca segura ganado 2026';
    const hash = await hashPassword(secret);

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain(secret);
    expect(await verifyPassword(hash, secret)).toBe(true);
    expect(await verifyPassword(hash, 'otra clave distinta 2026')).toBe(false);
  });

  it('enforces NIST SP 800-63B password policy (length >= 10, allows passphrases, rejects trivial)', () => {
    expect(validatePasswordPolicy('short123').valid).toBe(false);
    expect(validatePasswordPolicy('aaaaaaaaaaaa').valid).toBe(false);
    expect(validatePasswordPolicy('           ').valid).toBe(false);
    expect(validatePasswordPolicy('hacienda la pradera 2026').valid).toBe(true);
    expect(validatePasswordPolicy('correct horse battery staple').valid).toBe(true);
  });

  it('generates high-entropy tokens and stores irreversible SHA-256 hashes', () => {
    const tokenA = generateSecureToken(32);
    const tokenB = generateSecureToken(32);
    expect(tokenA).not.toBe(tokenB);
    expect(tokenA.length).toBeGreaterThanOrEqual(40);

    const hashA = sha256(tokenA);
    expect(hashA).toHaveLength(64);
    expect(hashA).not.toBe(tokenA);
    expect(timingSafeEqualHex(hashA, sha256(tokenA))).toBe(true);
    expect(timingSafeEqualHex(hashA, sha256(tokenB))).toBe(false);
  });

  it('hashes client IPs with server pepper for privacy minimization', () => {
    const h1 = hashIp('190.24.10.5', 'pepper-secret-1');
    const h2 = hashIp('190.24.10.5', 'pepper-secret-2');
    expect(h1).toHaveLength(64);
    expect(h1).not.toContain('190.24.10.5');
    expect(h1).not.toBe(h2);
  });

  it('prevents Open Redirect attacks via sanitizeRedirectPath', () => {
    expect(sanitizeRedirectPath('/dashboard')).toBe('/dashboard');
    expect(sanitizeRedirectPath('https://evil.example.com')).toBe('/');
    expect(sanitizeRedirectPath('//evil.example.com')).toBe('/');
    expect(sanitizeRedirectPath('/\\evil.example.com')).toBe('/');
    expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/');
  });

  it('enforces CSRF Origin and double-submit token validation', () => {
    process.env.APP_BASE_URL = 'https://app-ganadera.vercel.app';
    const csrfRaw = generateSecureToken(24);
    const csrfHash = sha256(csrfRaw);

    const validReq = {
      headers: {
        origin: 'https://app-ganadera.vercel.app',
        'x-csrf-token': csrfRaw,
      },
    } as any;
    expect(verifyCsrfProtection(validReq, csrfHash).ok).toBe(true);

    const crossOriginReq = {
      headers: {
        origin: 'https://attacker.com',
        'x-csrf-token': csrfRaw,
      },
    } as any;
    expect(verifyCsrfProtection(crossOriginReq, csrfHash).ok).toBe(false);

    const missingCsrfReq = {
      headers: {
        origin: 'https://app-ganadera.vercel.app',
      },
    } as any;
    expect(verifyCsrfProtection(missingCsrfReq, csrfHash).ok).toBe(false);
  });

  it('enforces sliding-window rate limiting and temporary lockout', () => {
    const key = 'login:test-ip:test-user';
    const baseTime = 1_700_000_000_000;

    for (let i = 0; i < 3; i++) {
      expect(checkInMemoryRateLimit(key, 3, 60, 300, baseTime + i * 1000).allowed).toBe(true);
    }

    const blocked = checkInMemoryRateLimit(key, 3, 60, 300, baseTime + 4000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(300);
  });
});
