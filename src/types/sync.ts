export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error' | 'success';

export interface SyncOutboxAction {
  id: string; // UUIDv7
  entityType: 'animal' | 'milking' | 'weight' | 'reproduction' | 'health' | 'finance' | 'lot' | 'pasture' | 'farm';
  actionType: 'create' | 'update' | 'delete';
  entityId: string;
  payload: any;
  timestamp: number;
  status: 'pending' | 'in_flight' | 'synced' | 'failed';
  retryCount: number;
  conflictDetails?: string;
}

export interface SyncPeer {
  id: string;
  name: string;
  ipAddress?: string;
  lastSeen: number;
  syncRole: 'leader' | 'peer';
}

export interface BackupMetadata {
  id: string;
  timestamp: number;
  animalCount: number;
  recordsCount: number;
  fileSizeBytes: number;
  appVersion: string;
  description: string;
}
