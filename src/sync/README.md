# Multi-Device Synchronization Engine

## Overview
Coordinates offline change tracking and bi-directional synchronization between local IndexedDB instances, remote peers, and backend cloud services. Implements an outbox queue architecture with Last-Write-Wins (LWW) conflict resolution.

## Interface
- `syncEngine`: Singleton instance of `SyncEngine` (`src/sync/engine.ts`).
- `syncEngine.startPeriodicSync()`: Initiates recurring synchronization timers and network listener hooks (`src/sync/engine.ts`).
- `syncEngine.stopPeriodicSync()`: Halts active polling and background network synchronization intervals (`src/sync/engine.ts`).
- `syncEngine.triggerSync()`: Manually flushes pending outbox mutations to available network targets (`src/sync/engine.ts`).
- `syncEngine.queueAction(action)`: Enqueues entity mutation payloads into `db.syncOutbox` (`src/sync/engine.ts`).
- `syncEngine.subscribeStatus(callback)`: Registers observers for connectivity transitions (`idle`, `syncing`, `offline`) (`src/sync/engine.ts`).

## Invariants
- Enqueued actions must retain monotonic ordering by UTC timestamp.
- Conflict resolution must favor the latest `updatedAt` epoch timestamp (Last-Write-Wins).
- Transient network failures must retain items in `db.syncOutbox` without loss.

## Side Effects
- Periodically pings network connectivity and processes `db.syncOutbox`.
- Dispatches state change events to registered UI listeners.

## Verification
- Run: `npm run build`
