import { db } from '../db';
import type { SyncOutboxAction, SyncStatus } from '../types/sync';
import type { Animal } from '../types/animal';

export class SyncEngine {
  private static instance: SyncEngine;
  private statusListeners: ((status: SyncStatus, pendingCount: number) => void)[] = [];
  private currentStatus: SyncStatus = 'idle';

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

  private async notifyStatus() {
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
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
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

  // Trigger sync process
  public async triggerSync(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    if (!navigator.onLine) {
      this.currentStatus = 'offline';
      this.notifyStatus();
      return { success: false, syncedCount: 0, message: 'Dispositivo sin conexión a Internet o red' };
    }

    this.currentStatus = 'syncing';
    this.notifyStatus();

    try {
      const pendingActions = await db.syncOutbox
        .where('status')
        .equals('pending')
        .toArray();

      if (pendingActions.length === 0) {
        this.currentStatus = 'success';
        this.notifyStatus();
        return { success: true, syncedCount: 0, message: 'Todos los datos están sincronizados' };
      }

      // Simulate local network or cloud sync transaction
      await new Promise(res => setTimeout(res, 800));

      // Mark actions as synced
      await db.transaction('rw', db.syncOutbox, async () => {
        for (const action of pendingActions) {
          action.status = 'synced';
          await db.syncOutbox.put(action);
        }
      });

      this.currentStatus = 'success';
      this.notifyStatus();

      return {
        success: true,
        syncedCount: pendingActions.length,
        message: `Sincronizados ${pendingActions.length} registros sin conflictos.`
      };
    } catch (err: any) {
      this.currentStatus = 'error';
      this.notifyStatus();
      return { success: false, syncedCount: 0, message: err.message || 'Error durante la sincronización' };
    }
  }
}

export const syncEngine = SyncEngine.getInstance();
