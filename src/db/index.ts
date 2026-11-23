import Dexie, { type EntityTable } from 'dexie';
import type { Animal, Lot, Pasture, Farm } from '../types/animal';
import type { ReproductionEvent } from '../types/reproduction';
import type { MilkingRecord, WeightRecord, HealthRecord } from '../types/production';
import type { FinancialRecord } from '../types/finance';
import type { SyncOutboxAction, BackupMetadata } from '../types/sync';

export interface FarmSettings {
  id: string;
  farmName: string;
  ownerName: string;
  country: string;
  currency: string;
  areaHectares: number;
  cattleBreedDefault: string;
  autoBackupIntervalHours: number;
  lastBackupTimestamp?: number;
  lanSyncEnabled: boolean;
}

export class AppGanaderaDatabase extends Dexie {
  farms!: EntityTable<Farm, 'id'>;
  animals!: EntityTable<Animal, 'id'>;
  lots!: EntityTable<Lot, 'id'>;
  pastures!: EntityTable<Pasture, 'id'>;
  reproductionEvents!: EntityTable<ReproductionEvent, 'id'>;
  milkingRecords!: EntityTable<MilkingRecord, 'id'>;
  weightRecords!: EntityTable<WeightRecord, 'id'>;
  healthRecords!: EntityTable<HealthRecord, 'id'>;
  financialRecords!: EntityTable<FinancialRecord, 'id'>;
  syncOutbox!: EntityTable<SyncOutboxAction, 'id'>;
  backups!: EntityTable<BackupMetadata, 'id'>;
  settings!: EntityTable<FarmSettings, 'id'>;

  constructor() {
    super('AppGanaderaDB');

    // Version 1 (Initial schema)
    this.version(1).stores({
      animals: 'id, earTagCode, electronicId, species, gender, currentStage, purpose, farmId, lotId, pastureId, status, updatedAt',
      lots: 'id, farmId, name, purpose, pastureId, updatedAt',
      pastures: 'id, farmId, name, status, updatedAt',
      reproductionEvents: 'id, animalId, eventType, date, sireId, pregnancyResult, projectedCalvingDate, mandatoryDryOffDate, updatedAt',
      milkingRecords: 'id, animalId, date, shift, liters',
      weightRecords: 'id, animalId, date, weightKg, averageDailyGainKg',
      healthRecords: 'id, animalId, date, type, safeMilkDate, safeMeatDate',
      financialRecords: 'id, farmId, date, type, category',
      syncOutbox: 'id, entityType, actionType, entityId, status, timestamp',
      backups: 'id, timestamp',
      settings: 'id'
    });

    // Version 2 (Multi-farm support)
    this.version(2).stores({
      farms: 'id, name, purpose, updatedAt',
      animals: 'id, earTagCode, electronicId, species, gender, currentStage, purpose, farmId, lotId, pastureId, status, updatedAt',
      lots: 'id, farmId, name, purpose, pastureId, updatedAt',
      pastures: 'id, farmId, name, status, updatedAt',
      reproductionEvents: 'id, animalId, eventType, date, sireId, pregnancyResult, projectedCalvingDate, mandatoryDryOffDate, updatedAt',
      milkingRecords: 'id, animalId, date, shift, liters',
      weightRecords: 'id, animalId, date, weightKg, averageDailyGainKg',
      healthRecords: 'id, animalId, date, type, safeMilkDate, safeMeatDate',
      financialRecords: 'id, farmId, date, type, category',
      syncOutbox: 'id, entityType, actionType, entityId, status, timestamp',
      backups: 'id, timestamp',
      settings: 'id'
    });
  }
}

export const db = new AppGanaderaDatabase();
