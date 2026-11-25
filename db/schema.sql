-- ============================================================================
-- APP GANADERA - PostgreSQL Authentication, Security & Privacy Schema
-- Standards: OWASP ASVS, NIST 800-63B, Ley 1581 de 2012 (Colombia), GDPR-ready
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Core Users Table (Data Minimization: only essential identity fields)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'zootechnician', 'investor', 'veterinarian', 'worker')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'pending_deletion', 'deleted')),
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- 2. External & Local Auth Identities (Unified Identity Model)
CREATE TABLE IF NOT EXISTS user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('password', 'google')),
  provider_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash TEXT, -- Argon2id PHC string; NULL for OAuth identities
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_identities_user_id ON user_identities (user_id);

-- 3. Opaque Server-Side Sessions (Token stored as SHA-256 hash)
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY, -- SHA-256(raw_session_token)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token_hash TEXT NOT NULL,
  ip_hash TEXT, -- Hashed IP with server pepper for privacy minimization
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idle_expires_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions (expires_at);

-- 4. Single-Use Expiring Auth Tokens (Email Verification, Password Reset, Email Change)
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE, -- SHA-256(raw_token)
  type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset', 'email_change')),
  target_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_type ON auth_tokens (user_id, type);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens (expires_at);

-- 5. Short-Lived OAuth 2.0 / OIDC State, PKCE & Nonce
CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY, -- SHA-256(state)
  code_verifier TEXT NOT NULL,
  nonce TEXT NOT NULL,
  redirect_to TEXT NOT NULL DEFAULT '/',
  consent_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Privacy & Personal Data Consents (Ley 1581 de 2012 / Decreto 1074 de 2015)
CREATE TABLE IF NOT EXISTS privacy_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_version TEXT NOT NULL,
  accepted_privacy_policy BOOLEAN NOT NULL,
  accepted_data_processing BOOLEAN NOT NULL,
  accepted_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  ip_hash TEXT,
  user_agent TEXT,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_consents_user ON privacy_consents (user_id, consented_at DESC);

-- 7. Security Audit Logs (Non-destructive, no plaintext credentials/tokens)
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_logs_user_time ON security_audit_logs (user_id, created_at DESC);

-- 8. Distributed Rate Limiting Store
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ
);

-- Note: Multi-tenant domain tables (farms, animals, records) will enable FORCE ROW LEVEL SECURITY
-- with a dedicated non-owner `app_user` role once cloud synchronization is added.
