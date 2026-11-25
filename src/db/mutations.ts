import type { EntityTable } from 'dexie';
import { db } from './index';
import { syncEngine } from '../sync/engine';
import type { SyncOutboxAction } from '../types/sync';
import { generateId } from '../utils/id';

/**
 * Atomically persists an entity in IndexedDB and records its mutation in syncOutbox
 * within a single Dexie read-write transaction.
 */
export async function saveEntityWithOutbox<T extends { id: string }>(
  table: EntityTable<T, 'id'>,
  entityType: SyncOutboxAction['entityType'],
  actionType: SyncOutboxAction['actionType'],
  record: T
): Promise<void> {
  const action: SyncOutboxAction = {
    id: generateId('evt'),
    entityType,
    actionType,
    entityId: record.id,
    payload: record,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0
  };

  await db.transaction('rw', [table, db.syncOutbox], async () => {
    await table.put(record);
    await db.syncOutbox.put(action);
  });

  await syncEngine.notifyStatus();
}
