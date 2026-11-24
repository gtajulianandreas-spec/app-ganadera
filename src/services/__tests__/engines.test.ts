import { describe, it, expect } from 'vitest';
import { ReproductionEngine } from '../reproductionEngine';
import { FinancialEngine } from '../financialEngine';
import { StageTransitionEngine } from '../stageTransitionEngine';
import { ExcelService, parseExcelDate } from '../excelService';
import { SyncEngine } from '../../sync/engine';
import type { Animal, StageTransitionConfig } from '../../types/animal';
import type { FinancialRecord } from '../../types/finance';
import type { MilkingRecord, WeightRecord } from '../../types/production';

describe('ReproductionEngine', () => {
  it('should return 283 days for Bos taurus (Holstein)', () => {
    const days = ReproductionEngine.getGestationPeriodDays('bovine', [
      { breedId: 'hol', breedName: 'Holstein', percentage: 100 }
    ]);
    expect(days).toBe(283);
  });

  it('should return 292 days for Bos indicus (Brahman >= 50%)', () => {
    const daysBrahman = ReproductionEngine.getGestationPeriodDays('bovine', [
      { breedId: 'brh', breedName: 'Brahman Blanco', percentage: 100 }
    ]);
    expect(daysBrahman).toBe(292);

    const daysGyr = ReproductionEngine.getGestationPeriodDays('bovine', [
      { breedId: 'gyr', breedName: 'Gyr Lechero', percentage: 75 },
      { breedId: 'hol', breedName: 'Holstein', percentage: 25 }
    ]);
    expect(daysGyr).toBe(292);
  });

  it('should return species-specific gestation periods', () => {
    expect(ReproductionEngine.getGestationPeriodDays('buffalo')).toBe(310);
    expect(ReproductionEngine.getGestationPeriodDays('equine')).toBe(335);
    expect(ReproductionEngine.getGestationPeriodDays('porcine')).toBe(114);
    expect(ReproductionEngine.getGestationPeriodDays('ovine')).toBe(150);
    expect(ReproductionEngine.getGestationPeriodDays('caprine')).toBe(150);
  });

  it('should calculate projected calving date and mandatory dry-off (60 days prior)', () => {
    const result = ReproductionEngine.calculateDates('2026-01-01', 'bovine', [
      { breedId: 'hol', breedName: 'Holstein', percentage: 100 }
    ]);

    // 2026-01-01 + 283 days = 2026-10-11
    expect(result.projectedCalvingDate).toBe('2026-10-11');
    // 2026-10-11 - 60 days = 2026-08-12
    expect(result.mandatoryDryOffDate).toBe('2026-08-12');
  });
});

describe('FinancialEngine', () => {
  it('should correctly compute income, expenses and unit economics', () => {
    const financials: FinancialRecord[] = [
      { id: 'f1', farmId: 'farm-1', date: '2026-05-01', type: 'income', category: 'milk_sale', description: 'Venta leche', amount: 1500, paymentMethod: 'transfer', createdAt: 1 },
      { id: 'f2', farmId: 'farm-1', date: '2026-05-02', type: 'income', category: 'animal_sale', description: 'Venta novillos', amount: 2000, paymentMethod: 'transfer', createdAt: 2 },
      { id: 'f3', farmId: 'farm-1', date: '2026-05-03', type: 'expense', category: 'feed_supplement', description: 'Concentrado', amount: 600, paymentMethod: 'cash', createdAt: 3 },
      { id: 'f4', farmId: 'farm-1', date: '2026-05-04', type: 'expense', category: 'veterinary_medicine', description: 'Medicamentos', amount: 200, paymentMethod: 'cash', createdAt: 4 },
      { id: 'f5', farmId: 'farm-1', date: '2026-05-05', type: 'expense', category: 'labor_payroll', description: 'Jornales', amount: 400, paymentMethod: 'cash', createdAt: 5 }
    ];

    const milkings: MilkingRecord[] = [
      { id: 'm1', animalId: 'a1', date: '2026-05-01', shift: 'AM', liters: 1000, createdAt: 1 },
      { id: 'm2', animalId: 'a2', date: '2026-05-01', shift: 'PM', liters: 1000, createdAt: 2 }
    ];

    const weights: WeightRecord[] = [
      { id: 'w1', animalId: 'a3', date: '2026-05-01', weightKg: 450, averageDailyGainKg: 0.8, source: 'manual', createdAt: 1 }
    ];

    const summary = FinancialEngine.calculateUnitEconomics(financials, milkings, weights);

    expect(summary.totalIncome).toBe(3500);
    expect(summary.totalExpense).toBe(1200);
    expect(summary.netProfit).toBe(2300);
    expect(summary.totalMilkRevenue).toBe(1500);
    expect(summary.totalBeefRevenue).toBe(2000);
    expect(summary.totalMilkProducedLiters).toBe(2000);
    expect(summary.costPerLiterMilk).toBeGreaterThan(0);
    expect(summary.grossMarginPerLiterMilk).toBeGreaterThan(0);
  });

  it('should handle zero milk gracefully without division by zero errors', () => {
    const summary = FinancialEngine.calculateUnitEconomics([], [], []);
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpense).toBe(0);
    expect(summary.costPerLiterMilk).toBe(0);
  });
});

describe('StageTransitionEngine', () => {
  it('should accurately calculate age in months and days from reference date', () => {
    const refDate = new Date('2026-06-15');
    const age = StageTransitionEngine.calculateAge('2025-01-15', refDate);

    expect(age.months).toBe(17);
    expect(age.days).toBeGreaterThan(500);
  });

  it('should recommend correct biological stage based on standard age thresholds', () => {
    expect(StageTransitionEngine.getRecommendedStage(5)).toBe('calf');
    expect(StageTransitionEngine.getRecommendedStage(7)).toBe('calf');
    expect(StageTransitionEngine.getRecommendedStage(8)).toBe('weaned');
    expect(StageTransitionEngine.getRecommendedStage(14)).toBe('weaned');
    expect(StageTransitionEngine.getRecommendedStage(15)).toBe('juvenile');
    expect(StageTransitionEngine.getRecommendedStage(24)).toBe('juvenile');
    expect(StageTransitionEngine.getRecommendedStage(25)).toBe('adult');
  });

  it('should support customized stage transition thresholds', () => {
    const customConfig: StageTransitionConfig = {
      calfMaxMonths: 6,
      weanedMaxMonths: 12,
      juvenileMaxMonths: 20
    };

    expect(StageTransitionEngine.getRecommendedStage(7, customConfig)).toBe('weaned');
    expect(StageTransitionEngine.getRecommendedStage(13, customConfig)).toBe('juvenile');
    expect(StageTransitionEngine.getRecommendedStage(21, customConfig)).toBe('adult');
  });
});

describe('SyncEngine (LWW Conflict Resolution)', () => {
  it('should resolve conflicts in favor of newer updatedAt timestamp (LWW)', () => {
    const localAnimal: Animal = {
      id: 'anm-1',
      earTagCode: 'HLP-101',
      species: 'bovine',
      gender: 'female',
      birthDate: '2023-01-01',
      currentStage: 'adult',
      purpose: 'milk',
      farmId: 'farm-1',
      breedComposition: [{ breedId: 'hol', breedName: 'Holstein', percentage: 100 }],
      status: 'active',
      notes: 'Nota local del mayordomo',
      createdAt: 1000,
      updatedAt: 2000,
      version: 1
    };

    const incomingAnimal: Animal = {
      ...localAnimal,
      currentWeightKg: 520,
      notes: '', // incoming had empty notes
      updatedAt: 3000, // strictly newer
      version: 1
    };

    const resolved = SyncEngine.resolveAnimalConflict(localAnimal, incomingAnimal);

    expect(resolved.currentWeightKg).toBe(520);
    // Preserves local notes if incoming left them blank
    expect(resolved.notes).toBe('Nota local del mayordomo');
    expect(resolved.version).toBe(2);
  });

  it('should keep local record unchanged if local is newer than incoming', () => {
    const localAnimal: Animal = {
      id: 'anm-1',
      earTagCode: 'HLP-101',
      species: 'bovine',
      gender: 'female',
      birthDate: '2023-01-01',
      currentStage: 'adult',
      purpose: 'milk',
      farmId: 'farm-1',
      breedComposition: [{ breedId: 'hol', breedName: 'Holstein', percentage: 100 }],
      status: 'active',
      createdAt: 1000,
      updatedAt: 5000, // local is newer
      version: 2
    };

    const incomingOlderAnimal: Animal = {
      ...localAnimal,
      currentWeightKg: 400,
      updatedAt: 4000,
      version: 1
    };

    const resolved = SyncEngine.resolveAnimalConflict(localAnimal, incomingOlderAnimal);

    expect(resolved.updatedAt).toBe(5000);
    expect(resolved.currentWeightKg).toBeUndefined();
  });
});

describe('ExcelService Date Parsing (parseExcelDate)', () => {
  it('should convert Excel serial numbers to ISO date string', () => {
    // 44562 in Excel serial corresponds to 2022-01-01
    expect(parseExcelDate(44562)).toBe('2022-01-01');
  });

  it('should preserve standard ISO YYYY-MM-DD date strings', () => {
    expect(parseExcelDate('2024-08-20')).toBe('2024-08-20');
  });

  it('should convert numeric strings representing serial dates', () => {
    expect(parseExcelDate('44562')).toBe('2022-01-01');
  });

  it('should fallback to 2022-01-01 for undefined or malformed values', () => {
    expect(parseExcelDate(undefined)).toBe('2022-01-01');
    expect(parseExcelDate('not-a-date')).toBe('2022-01-01');
  });
});
