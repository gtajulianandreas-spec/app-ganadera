# Local-First Database & Storage Engine

## Overview
Manages the client-side persistent storage layer using IndexedDB via Dexie.js. Enables complete offline-first operation in rural environments with automatic indexing, transactional schema updates, backup serialization, and demo bootstrapping.

## Interface
- `db`: Singleton instance of `AppDatabase` providing reactive collection queries and ACID transactions (`src/db/index.ts`).
- `db.farms`, `db.animals`, `db.lots`, `db.pastures`: Indexed tables for livestock inventory and farm properties (`src/db/index.ts`).
- `db.milkingRecords`, `db.weightRecords`, `db.healthRecords`: Production, weight, and veterinary treatment stores (`src/db/index.ts`).
- `db.reproductionEvents`, `db.financialRecords`: Reproductive event logs and financial transaction ledgers (`src/db/index.ts`).
- `db.syncOutbox`: Transactional queue for pending offline sync operations (`src/db/index.ts`).
- `createFullBackup()`, `downloadBackupFile()`, `restoreFromBackup()`: JSON database serialization, snapshot download, and atomic restoration functions (`src/db/backup.ts`).
- `seedDemoDataIfEmpty()`: Initial sample dataset bootstrapper with schema migration guards (`src/db/seed.ts`).

## Invariants
- Database versioning must remain backwards-compatible with existing client databases.
- Deletions or additions must queue a corresponding entry in `db.syncOutbox` if offline sync is active.
- `seedDemoDataIfEmpty` only writes when `db.farms.count() === 0` or when `app_seed_version` mismatches.

## Side Effects
- Mutates client browser IndexedDB (`AppGanaderaDB`).
- Writes to browser `localStorage` for seed migration tracking.
- Reads and triggers filesystem downloads for backup snapshots (`.ganado.backup`).

## Verification
- Run: `npm run build`
