import { db } from '../db';
import type { SyncOutboxAction, SyncStatus } from '../types/sync';
import type { Animal } from '../types/animal';
import { generateId } from '../utils/id';

export class SyncEngine {
  private static instance: SyncEngine;
  private statusListeners: ((status: SyncStatus, pendingCount: number) => void)[] = [];
  private currentStatus: SyncStatus = 'idle';
  private isSyncing: boolean = false;
  private cloudUserId: string | null = null;
  private cloudApiFetch: ((url: string, init?: RequestInit) => Promise<Response>) | null = null;

  public configureCloudSync(options: {
    userId: string | null;
    apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  }) {
    this.cloudUserId = options.userId;
    this.cloudApiFetch = options.apiFetch;
  }

  private constructor() {
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));
  }

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  public subscribeStatus(listener: (status: SyncStatus, pendingCount: number) => void) {
    this.statusListeners.push(listener);
    this.notifyStatus();
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  public async notifyStatus() {
    const pendingCount = await db.syncOutbox.where('status').equals('pending').count();
    const status: SyncStatus = !navigator.onLine ? 'offline' : this.currentStatus;
    this.statusListeners.forEach(listener => listener(status, pendingCount));
  }

  private handleNetworkChange(online: boolean) {
    if (online) {
      this.currentStatus = 'idle';
      this.triggerSync();
    } else {
      this.currentStatus = 'offline';
    }
    this.notifyStatus();
  }

  private syncIntervalTimer: any = null;

  public startPeriodicSync(intervalMs: number = 30000) {
    if (this.syncIntervalTimer) return;
    this.syncIntervalTimer = setInterval(() => {
      if (navigator.onLine) {
        this.triggerSync();
      }
    }, intervalMs);
  }

  public stopPeriodicSync() {
    if (this.syncIntervalTimer) {
      clearInterval(this.syncIntervalTimer);
      this.syncIntervalTimer = null;
    }
  }

  // Alias for queueAction
  public async enqueueChange(
    entityType: SyncOutboxAction['entityType'],
    entityId: string,
    actionType: SyncOutboxAction['actionType'],
    payload: any
  ) {
    return this.queueAction(entityType, actionType, entityId, payload);
  }

  // Enqueue a local mutation into outbox
  public async queueAction(
    entityType: SyncOutboxAction['entityType'],
    actionType: SyncOutboxAction['actionType'],
    entityId: string,
    payload: any
  ) {
    const action: SyncOutboxAction = {
      id: generateId('evt'),
      entityType,
      actionType,
      entityId,
      payload,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    await db.syncOutbox.put(action);
    this.notifyStatus();

    // If online, attempt background sync immediately
    if (navigator.onLine) {
      this.triggerSync();
    }
  }

  // Enqueue multiple local mutations in a single IndexedDB transaction
  public async bulkQueueActions(
    items: Array<{
      entityType: SyncOutboxAction['entityType'];
      actionType: SyncOutboxAction['actionType'];
      entityId: string;
      payload: any;
    }>
  ) {
    if (items.length === 0) return;

    const now = Date.now();
    const actions: SyncOutboxAction[] = items.map(item => ({
      id: generateId('evt'),
      entityType: item.entityType,
      actionType: item.actionType,
      entityId: item.entityId,
      payload: item.payload,
      timestamp: now,
      status: 'pending',
      retryCount: 0
    }));

    await db.syncOutbox.bulkPut(actions);
    this.notifyStatus();

    if (navigator.onLine) {
      this.triggerSync();
    }
  }

  // Field-level LWW conflict resolver for Animals
  public static resolveAnimalConflict(local: Animal, incoming: Animal): Animal {
    // If incoming is strictly newer
    if (incoming.updatedAt > local.updatedAt) {
      return {
        ...incoming,
        // Preserve local notes if incoming left them blank
        notes: incoming.notes || local.notes,
        // Ensure version increases
        version: Math.max(local.version, incoming.version) + 1
      };
    }
    // Local is newer
    return local;
  }

  /**
   * Removes synced outbox entries older than maxAgeMs (default 7 days)
   * to prevent unbounded IndexedDB growth.
   */
  public async pruneSyncedActions(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = Date.now() - maxAgeMs;
    const staleIds = await db.syncOutbox
      .where('status')
      .equals('synced')
      .filter(entry => entry.timestamp < cutoff)
      .primaryKeys();

    if (staleIds.length > 0) {
      await db.syncOutbox.bulkDelete(staleIds);
    }
    return staleIds.length;
  }

  // Trigger sync process
  public async triggerSync(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    if (this.isSyncing) {
      return { success: true, syncedCount: 0, message: 'Sincronización en curso' };
    }

    if (!navigator.onLine) {
      this.currentStatus = 'offline';
      this.notifyStatus();
      return { success: false, syncedCount: 0, message: 'Dispositivo sin conexión a Internet o red' };
    }

    this.isSyncing = true;
    this.currentStatus = 'syncing';
    this.notifyStatus();

    try {
      const pendingActions = await db.syncOutbox
        .where('status')
        .equals('pending')
        .toArray();

      // If not authenticated, keep outbox items honestly as 'pending' locally
      if (!this.cloudUserId || !this.cloudApiFetch) {
        if (pendingActions.length === 0) {
          this.currentStatus = 'success';
          this.notifyStatus();
          return { success: true, syncedCount: 0, message: 'Todos los datos están al día localmente' };
        }

        this.currentStatus = 'idle';
        this.notifyStatus();
        return {
          success: true,
          syncedCount: 0,
          message: `${pendingActions.length} cambios guardados localmente (inicia sesión para respaldar en la nube).`
        };
      }

      // 1. Push pending outbox batches to PostgreSQL
      let pushedCount = 0;
      const BATCH_SIZE = 50;
      for (let i = 0; i < pendingActions.length; i += BATCH_SIZE) {
        const batch = pendingActions.slice(i, i + BATCH_SIZE);

        await db.syncOutbox.bulkPut(batch.map(a => ({ ...a, status: 'in_flight' as const })));

        const pushRes = await this.cloudApiFetch('/api/sync/push', {
          method: 'POST',
          body: JSON.stringify({ actions: batch }),
        });

        if (!pushRes.ok) {
          await db.syncOutbox.bulkPut(
            batch.map(a => ({ ...a, status: 'pending' as const, retryCount: a.retryCount + 1 }))
          );
          if (pushRes.status === 503) {
            this.currentStatus = 'idle';
            this.notifyStatus();
            return {
              success: true,
              syncedCount: 0,
              message: `${pendingActions.length} cambios guardados localmente (backend de nube no configurado).`
            };
          }
          throw new Error(`Error al sincronizar lote (${pushRes.status})`);
        }

        const pushJson = (await pushRes.json()) as {
          ok: boolean;
          appliedIds?: string[];
          rejected?: Array<{ id: string; reason: string }>;
        };

        const appliedSet = new Set(pushJson.appliedIds || []);
        const rejectedMap = new Map((pushJson.rejected || []).map(r => [r.id, r.reason]));

        await db.syncOutbox.bulkPut(
          batch.map(a => {
            if (appliedSet.has(a.id)) {
              pushedCount++;
              return { ...a, status: 'synced' as const };
            }
            if (rejectedMap.has(a.id)) {
              return { ...a, status: 'failed' as const, conflictDetails: rejectedMap.get(a.id) };
            }
            return { ...a, status: 'pending' as const, retryCount: a.retryCount + 1 };
          })
        );
      }

      await this.pruneSyncedActions();

      // 2. Pull incremental server changes using monotonic server_seq
      const seqKey = `ag_sync_seq_${this.cloudUserId}`;
      let sinceSeq = Number.parseInt(localStorage.getItem(seqKey) || '0', 10) || 0;
      let pulledCount = 0;
      let hasMore = true;

      while (hasMore) {
        const pullRes = await this.cloudApiFetch(`/api/sync/pull?since_seq=${sinceSeq}&limit=100`);
        if (!pullRes.ok) {
          hasMore = false;
          break;
        }
        const pullJson = (await pullRes.json()) as {
          ok: boolean;
          changes?: Array<{
            entityType: SyncOutboxAction['entityType'];
            entityId: string;
            payload: Record<string, unknown>;
            deleted: boolean;
          }>;
          latestSeq?: number;
          hasMore?: boolean;
        };

        const changes = pullJson.changes || [];
        if (changes.length > 0) {
          await this.applyPulledChanges(changes);
          pulledCount += changes.length;
        }

        if (typeof pullJson.latestSeq === 'number' && pullJson.latestSeq > sinceSeq) {
          sinceSeq = pullJson.latestSeq;
          localStorage.setItem(seqKey, String(sinceSeq));
        }

        hasMore = Boolean(pullJson.hasMore);
      }

      this.currentStatus = 'success';
      this.notifyStatus();

      return {
        success: true,
        syncedCount: pushedCount + pulledCount,
        message:
          pushedCount + pulledCount > 0
            ? `Sincronizados ${pushedCount} enviados y ${pulledCount} recibidos.`
            : 'Todos los datos están sincronizados con la nube'
      };
    } catch (err: any) {
      this.currentStatus = 'error';
      this.notifyStatus();
      return { success: false, syncedCount: 0, message: err.message || 'Error durante la sincronización' };
    } finally {
      this.isSyncing = false;
    }
  }

  private async applyPulledChanges(
    changes: Array<{
      entityType: SyncOutboxAction['entityType'];
      entityId: string;
      payload: Record<string, unknown>;
      deleted: boolean;
    }>
  ): Promise<void> {
    const tableMap = {
      farm: db.farms,
      animal: db.animals,
      lot: db.lots,
      pasture: db.pastures,
      reproduction: db.reproductionEvents,
      milking: db.milkingRecords,
      weight: db.weightRecords,
      health: db.healthRecords,
      finance: db.financialRecords,
    } as const;

    const tables = Object.values(tableMap);
    await db.transaction('rw', tables, async () => {
      for (const change of changes) {
        const table = tableMap[change.entityType];
        if (!table) continue;
        if (change.deleted) {
          await table.delete(change.entityId);
        } else {
          await (table as any).put(change.payload);
        }
      }
    });
  }
}

export const syncEngine = SyncEngine.getInstance();
