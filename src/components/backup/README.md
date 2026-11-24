# Backup & Atomic Restore Manager

## Overview
Provides manual and automated snapshot exports of the entire IndexedDB database, generating encrypted/structured `.ganado.backup` files, and supporting atomic restoration.

## Interface
- `BackupRestoreModal`: UI dialog for generating backup snapshots and restoring data from previous backup files (`BackupRestoreModal.tsx`).

## Invariants
- Restoration must be atomic: all tables are cleared and repopulated inside a single transaction to prevent partial state corruption.
- Exported files must contain schema version and UTC export timestamps.

## Side Effects
- Reads and clears all IndexedDB stores during full restore.
- Triggers browser file download dialogues for `.ganado.backup` exports.

## Verification
- Run: `npm run build`
