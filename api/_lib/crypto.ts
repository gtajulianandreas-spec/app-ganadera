import crypto from 'node:crypto';
import { hash as argon2Hash, verify as argon2Verify, Algorithm } from '@node-rs/argon2';

// OWASP Password Storage Cheat Sheet recommended Argon2id parameters
const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2Hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(storedHash: string, candidatePassword: string): Promise<boolean> {
  try {
    return await argon2Verify(storedHash, candidatePassword);
  } catch {
    return false;
  }
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * NIST SP 800-63B aligned password policy:
 * - Minimum 10 characters (supports long passphrases up to 128 chars)
 * - No arbitrary composition rules (symbols/uppercase) that reduce memorability
 * - Rejects trivial single-character repetition or blank-only strings
 */
export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (typeof password !== 'string') {
    return { valid: false, errors: ['La contraseña debe ser una cadena de texto válida.'] };
  }

  if (password.length < 10) {
    errors.push('Debe tener al menos 10 caracteres (puedes usar una frase larga).');
  }

  if (password.length > 128) {
    errors.push('No debe superar los 128 caracteres.');
  }

  if (password.trim().length === 0) {
    errors.push('La contraseña no puede contener solo espacios.');
  }

  if (/^(.)\1+$/.test(password)) {
    errors.push('La contraseña no puede consistir en un único carácter repetido.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Checks whether a password appears in known breaches using Have I Been Pwned k-anonymity API.
 * Only sends the first 5 characters of SHA-1(password); never transmits the password or full hash.
 */
export async function checkPasswordCompromised(password: string): Promise<boolean> {
  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) return false;
    const body = await response.text();
    return body.split('\n').some(line => line.split(':')[0]?.trim() === suffix);
  } catch {
    // Fail-open on external HIBP network timeout so availability is preserved
    return false;
  }
}

export function generateSecureToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString('base64url');
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function hashIp(ip: string, pepper: string): string {
  return crypto.createHmac('sha256', pepper).update(ip || 'unknown').digest('hex');
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function validateAndHashNewPassword(
  password: string
): Promise<{ ok: true; hash: string } | { ok: false; error: string }> {
  const policyCheck = validatePasswordPolicy(password);
  if (!policyCheck.valid) {
    return { ok: false, error: policyCheck.errors[0] };
  }
  const compromised = await checkPasswordCompromised(password);
  if (compromised) {
    return {
      ok: false,
      error: 'Esta contraseña aparece en filtraciones públicas conocidas. Elige una frase o contraseña distinta.',
    };
  }
  const hash = await hashPassword(password);
  return { ok: true, hash };
}
