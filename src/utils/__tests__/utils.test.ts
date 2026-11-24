import { describe, it, expect } from 'vitest';
import { generateId } from '../id';
import { getTodayStr, addDays, isOverdue } from '../date';

describe('ID Utility (src/utils/id)', () => {
  it('generates ID with default prefix "ent"', () => {
    const id = generateId();
    expect(id).toMatch(/^ent_/);
    expect(id.length).toBeGreaterThan(10);
  });

  it('generates ID with specified custom prefix', () => {
    const animalId = generateId('anm');
    const farmId = generateId('farm');
    const milkId = generateId('milk');

    expect(animalId).toMatch(/^anm_/);
    expect(farmId).toMatch(/^farm_/);
    expect(milkId).toMatch(/^milk_/);
  });

  it('generates unique collision-free IDs across consecutive calls', () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) {
      set.add(generateId('test'));
    }
    expect(set.size).toBe(50);
  });
});

describe('Date Utility (src/utils/date)', () => {
  it('getTodayStr returns valid YYYY-MM-DD format', () => {
    const today = getTodayStr();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('addDays correctly shifts dates forward and backward', () => {
    const base = '2026-05-10';
    expect(addDays(5, base)).toBe('2026-05-15');
    expect(addDays(-5, base)).toBe('2026-05-05');
    expect(addDays(0, base)).toBe('2026-05-10');
  });

  it('isOverdue correctly detects past vs future dates', () => {
    const ref = '2026-06-01';
    expect(isOverdue('2026-05-31', ref)).toBe(true);
    expect(isOverdue('2026-06-01', ref)).toBe(false);
    expect(isOverdue('2026-06-02', ref)).toBe(false);
  });
});
