-- ============================================================================
-- Migration 001: Multi-Tenant Domain Sync & Row-Level Security (RLS)
-- Compatible with PostgreSQL 15+ (Neon, Supabase, RDS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. Farm Memberships & Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS farm_memberships (
  farm_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'zootechnician', 'investor', 'veterinarian', 'worker')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (farm_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_farm_memberships_user ON farm_memberships (user_id);

-- 2. Normalized Multi-Tenant Domain Entities with Monotonic Server Sequence
CREATE SEQUENCE IF NOT EXISTS farm_entities_seq_global;

CREATE TABLE IF NOT EXISTS farm_entities (
  farm_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('farm', 'animal', 'lot', 'pasture', 'reproduction', 'milking', 'weight', 'health', 'finance')
  ),
  entity_id TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  server_seq BIGINT NOT NULL DEFAULT nextval('farm_entities_seq_global'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (farm_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_farm_entities_server_seq ON farm_entities (server_seq);
CREATE INDEX IF NOT EXISTS idx_farm_entities_farm_seq ON farm_entities (farm_id, server_seq);

-- 3. Idempotency Log for Offline Outbox Events (SyncOutboxAction.id)
CREATE TABLE IF NOT EXISTS sync_applied_events (
  event_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_applied_events_user ON sync_applied_events (user_id, applied_at DESC);

-- 4. Strict Row-Level Security (RLS) Enforcement
-- Transactions must call: SELECT set_config('app.current_user_id', '<uuid>', true);
ALTER TABLE farm_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_memberships FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS farm_memberships_isolation ON farm_memberships;
CREATE POLICY farm_memberships_isolation ON farm_memberships
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

ALTER TABLE farm_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_entities FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS farm_entities_isolation ON farm_entities;
CREATE POLICY farm_entities_isolation ON farm_entities
  USING (
    EXISTS (
      SELECT 1
      FROM farm_memberships fm
      WHERE fm.farm_id = farm_entities.farm_id
        AND fm.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM farm_memberships fm
      WHERE fm.farm_id = farm_entities.farm_id
        AND fm.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        AND fm.role IN ('admin', 'zootechnician', 'veterinarian', 'worker')
    )
  );

ALTER TABLE sync_applied_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_applied_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sync_applied_events_isolation ON sync_applied_events;
CREATE POLICY sync_applied_events_isolation ON sync_applied_events
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

INSERT INTO schema_migrations (version)
VALUES ('001_domain_sync_and_rls')
ON CONFLICT (version) DO NOTHING;
