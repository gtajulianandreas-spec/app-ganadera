export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

export function getAppBaseUrl(): string {
  const raw = process.env.APP_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return raw.replace(/\/+$/, '');
}

export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();
  origins.add(new URL(getAppBaseUrl()).origin);
  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }
  return Array.from(origins);
}

export function getServerPepper(): string {
  const pepper = process.env.AUTH_SERVER_PEPPER;
  if (isProduction() && (!pepper || pepper.length < 32)) {
    throw new Error('AUTH_SERVER_PEPPER must be configured with at least 32 characters in production.');
  }
  return pepper || 'dev-only-insecure-pepper-change-in-production-32bytes';
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not configured.');
  }
  return url;
}

export function getGoogleOAuthConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured.');
  }
  return {
    clientId,
    clientSecret,
    redirectUri: `${getAppBaseUrl()}/api/auth/google/callback`,
  };
}

export function getResendConfig(): { apiKey: string | undefined; from: string } {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'APP GANADERA <no-reply@appganadera.local>',
  };
}

export function getPrivacyPolicyVersion(): string {
  return process.env.PRIVACY_POLICY_VERSION || '2026-11-v1';
}
