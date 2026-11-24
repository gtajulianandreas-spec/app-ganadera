import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { AppGanaderaDatabase } from '../index';
import type { MilkingRecord } from '../../types/production';

describe('Dexie v3 Database Schema (src/db/index.ts)', () => {
  let testDb: AppGanaderaDatabase;

  beforeEach(async () => {
    testDb = new AppGanaderaDatabase();
    await testDb.open();
  });

  it('initializes database with version 3', () => {
    expect(testDb.verno).toBe(3);
  });

  it('has all core entities registered', () => {
    const tableNames = testDb.tables.map(t => t.name);
    expect(tableNames).toContain('farms');
    expect(tableNames).toContain('animals');
    expect(tableNames).toContain('reproductionEvents');
    expect(tableNames).toContain('milkingRecords');
    expect(tableNames).toContain('weightRecords');
    expect(tableNames).toContain('healthRecords');
  });

  it('supports direct querying by indexed farmId', async () => {
    const sampleRecord: MilkingRecord = {
      id: 'milk-test-1',
      farmId: 'farm-123',
      animalId: 'cow-1',
      date: '2026-11-23',
      shift: 'AM',
      liters: 15.2,
      createdAt: Date.now()
    };

    await testDb.milkingRecords.put(sampleRecord);

    const found = await testDb.milkingRecords.where('farmId').equals('farm-123').toArray();
    expect(found.length).toBe(1);
    expect(found[0].id).toBe('milk-test-1');
    expect(found[0].liters).toBe(15.2);
  });
});
