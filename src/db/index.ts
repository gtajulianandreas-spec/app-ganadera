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

  constructor(dbName: string = 'AppGanaderaDB') {
    super(dbName);

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

    // Version 3 (Indexed farmId on relational records for O(1) multi-farm queries)
    this.version(3).stores({
      farms: 'id, name, purpose, updatedAt',
      animals: 'id, earTagCode, electronicId, species, gender, currentStage, purpose, farmId, lotId, pastureId, status, updatedAt',
      lots: 'id, farmId, name, purpose, pastureId, updatedAt',
      pastures: 'id, farmId, name, status, updatedAt',
      reproductionEvents: 'id, farmId, animalId, eventType, date, sireId, pregnancyResult, projectedCalvingDate, mandatoryDryOffDate, updatedAt',
      milkingRecords: 'id, farmId, animalId, date, shift, liters',
      weightRecords: 'id, farmId, animalId, date, weightKg, averageDailyGainKg',
      healthRecords: 'id, farmId, animalId, date, type, safeMilkDate, safeMeatDate',
      financialRecords: 'id, farmId, date, type, category',
      syncOutbox: 'id, entityType, actionType, entityId, status, timestamp',
      backups: 'id, timestamp',
      settings: 'id'
    }).upgrade(async tx => {
      const animals = await tx.table('animals').toArray();
      const animalFarmMap = new Map(animals.map(a => [a.id, a.farmId]));
      const defaultFarmId = animals[0]?.farmId || 'farm-1';

      const backfillTable = async (tableName: string) => {
        await tx.table(tableName).toCollection().modify((record: { farmId?: string; animalId?: string }) => {
          if (!record.farmId) {
            record.farmId = (record.animalId ? animalFarmMap.get(record.animalId) : undefined) || defaultFarmId;
          }
        });
      };

      await backfillTable('reproductionEvents');
      await backfillTable('milkingRecords');
      await backfillTable('weightRecords');
      await backfillTable('healthRecords');
    });
  }
}

let activeDb = new AppGanaderaDatabase('AppGanaderaDB');

/**
 * Switches the active IndexedDB database to a user-scoped namespace
 * (`AppGanaderaDB_<userId>`) to guarantee multi-tenant isolation on shared devices.
 */
export async function switchDatabaseTenant(userId: string | null): Promise<void> {
  const targetName = userId ? `AppGanaderaDB_${userId}` : 'AppGanaderaDB';
  if (activeDb.name === targetName) return;

  activeDb.close();
  activeDb = new AppGanaderaDatabase(targetName);
  await activeDb.open();
}

export const db: AppGanaderaDatabase = new Proxy({} as AppGanaderaDatabase, {
  get(_target, prop) {
    const value = (activeDb as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(activeDb) : value;
  }
});
