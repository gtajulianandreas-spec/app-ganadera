import { db } from './index';
import type { Animal, Lot, Pasture, Farm } from '../types/animal';
import type { ReproductionEvent } from '../types/reproduction';
import type { MilkingRecord, WeightRecord, HealthRecord } from '../types/production';
import type { FinancialRecord } from '../types/finance';
import { samplePhotos } from '../services/samplePhotos';

const CURRENT_SEED_VERSION = 'v3_minimal';

export async function seedDemoDataIfEmpty(forceReset = false) {
  const currentSavedVersion = localStorage.getItem('app_seed_version');

  // If version changed or forceReset requested, clean and re-seed with minimal dataset
  if (forceReset || currentSavedVersion !== CURRENT_SEED_VERSION) {
    console.log('Cleaning up old demo data and applying minimal lean dataset...');
    try {
      await db.transaction('rw', [
        db.farms, db.pastures, db.lots, db.animals, 
        db.reproductionEvents, db.milkingRecords, db.weightRecords, 
        db.healthRecords, db.financialRecords, db.settings
      ], async () => {
        await db.farms.clear();
        await db.pastures.clear();
        await db.lots.clear();
        await db.animals.clear();
        await db.reproductionEvents.clear();
        await db.milkingRecords.clear();
        await db.weightRecords.clear();
        await db.healthRecords.clear();
        await db.financialRecords.clear();
      });
      localStorage.setItem('app_seed_version', CURRENT_SEED_VERSION);
    } catch (e) {
      console.warn('Error clearing old tables:', e);
    }
  }

  // Check if data already exists
  const farmCount = await db.farms.count();
  if (farmCount > 0) {
    return;
  }

  console.log('Seeding minimal demo dataset (1 finca, 3 animales)...');

  // 1. Single Main Farm (Hacienda La Pradera)
  const demoFarms: Farm[] = [
    {
      id: 'farm-1',
      name: 'Hacienda La Pradera',
      ownerName: 'Juan Carlos Gómez',
      location: 'Valle de Ubaté, Cundinamarca',
      country: 'Colombia',
      currency: 'USD',
      areaHectares: 85,
      cattleBreedDefault: 'Girolando / Holstein',
      purpose: 'dual_purpose',
      createdAt: Date.now() - 180 * 86400000,
      updatedAt: Date.now()
    }
  ];
  await db.farms.bulkPut(demoFarms);

  // 2. Settings
  await db.settings.put({
    id: 'default_farm',
    farmName: 'Hacienda La Pradera',
    ownerName: 'Juan Carlos Gómez',
    country: 'Colombia',
    currency: 'USD',
    areaHectares: 85,
    cattleBreedDefault: 'Girolando',
    autoBackupIntervalHours: 24,
    lanSyncEnabled: true,
  });

  // 3. Two Simple Pastures
  const pastures: Pasture[] = [
    { 
      id: 'pas-1', 
      farmId: 'farm-1', 
      name: 'Potrero 1 - El Rodeo', 
      areaHectares: 40, 
      grassType: 'Brachiaria Brizantha', 
      capacityAnimalUnits: 45, 
      restingDays: 28, 
      status: 'occupied', 
      updatedAt: Date.now() 
    },
    { 
      id: 'pas-2', 
      farmId: 'farm-1', 
      name: 'Potrero 2 - La Ceiba', 
      areaHectares: 45, 
      grassType: 'Estrella Africana', 
      capacityAnimalUnits: 50, 
      restingDays: 24, 
      status: 'resting', 
      updatedAt: Date.now() 
    }
  ];
  await db.pastures.bulkPut(pastures);

  // 4. Two Clear Lots
  const lots: Lot[] = [
    { 
      id: 'lot-1', 
      farmId: 'farm-1', 
      name: 'Lote 1: Vacas en Ordeño', 
      purpose: 'milk', 
      color: '#10b981', 
      pastureId: 'pas-1', 
      updatedAt: Date.now() 
    },
    { 
      id: 'lot-2', 
      farmId: 'farm-1', 
      name: 'Lote 2: Ceba y Cría', 
      purpose: 'beef', 
      color: '#f59e0b', 
      pastureId: 'pas-2', 
      updatedAt: Date.now() 
    }
  ];
  await db.lots.bulkPut(lots);

  // 5. Exactly 3 Animals (Clean, representative sample)
  const animals: Animal[] = [
    // Animal 1: Cow in active milking
    {
      id: 'cow-101',
      earTagCode: 'HLP-101',
      electronicId: '982000412891001',
      name: 'Mariposa',
      species: 'bovine',
      gender: 'female',
      birthDate: '2021-03-15',
      birthWeightKg: 38,
      currentWeightKg: 540,
      currentStage: 'adult',
      purpose: 'milk',
      breedComposition: [{ breedId: 'holstein', breedName: 'Holstein', percentage: 75 }, { breedId: 'gyr', breedName: 'Gyr', percentage: 25 }],
      farmId: 'farm-1',
      lotId: 'lot-1',
      pastureId: 'pas-1',
      status: 'active',
      photoUrl: samplePhotos.holstein('HLP-101'),
      notes: 'Excelente productora, 2do tercio de lactancia en ordeño.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    },
    // Animal 2: Pregnant cow approaching dry-off
    {
      id: 'cow-102',
      earTagCode: 'HLP-102',
      electronicId: '982000412891002',
      name: 'Esperanza',
      species: 'bovine',
      gender: 'female',
      birthDate: '2020-09-20',
      birthWeightKg: 36,
      currentWeightKg: 580,
      currentStage: 'adult',
      purpose: 'dual_purpose',
      breedComposition: [{ breedId: 'girolando', breedName: 'Girolando', percentage: 100 }],
      farmId: 'farm-1',
      lotId: 'lot-1',
      pastureId: 'pas-1',
      status: 'active',
      photoUrl: samplePhotos.jersey('HLP-102'),
      notes: 'Preñada de 7 meses, próxima a período de secado.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    },
    // Animal 3: Juvenile steer for fattening and scale weighing
    {
      id: 'steer-103',
      earTagCode: 'HLP-103',
      electronicId: '982000412891003',
      name: 'Titan',
      species: 'bovine',
      gender: 'male',
      birthDate: '2025-01-10',
      birthWeightKg: 40,
      currentWeightKg: 420,
      currentStage: 'juvenile',
      purpose: 'beef',
      breedComposition: [{ breedId: 'brahman', breedName: 'Brahman', percentage: 100 }],
      farmId: 'farm-1',
      lotId: 'lot-2',
      pastureId: 'pas-2',
      status: 'active',
      photoUrl: samplePhotos.brahman('HLP-103', 'red'),
      notes: 'Novillo de levante con alta ganancia diaria de peso.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    }
  ];
  await db.animals.bulkPut(animals);

  // 6. Reproduction Event (For Cow Esperanza - Triggers dry-off and calving reminders)
  const reproEvents: ReproductionEvent[] = [
    {
      id: 'rep-1',
      animalId: 'cow-102',
      eventType: 'pregnancy_check',
      date: '2026-06-15',
      pregnancyResult: 'pregnant',
      daysPregnant: 215,
      technicianName: 'Dr. Ricardo Rivas',
      projectedCalvingDate: '2026-12-24',
      mandatoryDryOffDate: '2026-10-25',
      notes: 'Preñez confirmada por palpación, feto vigoroso.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];
  await db.reproductionEvents.bulkPut(reproEvents);

  // 7. Milking Records (Last 3 days for Cow Mariposa)
  const milkRecords: MilkingRecord[] = [];
  const today = new Date();
  for (let i = 2; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    milkRecords.push(
      { 
        id: `milk-101-am-${i}`, 
        animalId: 'cow-101', 
        date: dateStr, 
        shift: 'AM', 
        liters: 14.5, 
        fatPercentage: 3.8, 
        proteinPercentage: 3.2, 
        milkerName: 'Carlos M.', 
        createdAt: Date.now() 
      },
      { 
        id: `milk-101-pm-${i}`, 
        animalId: 'cow-101', 
        date: dateStr, 
        shift: 'PM', 
        liters: 10.2, 
        fatPercentage: 3.9, 
        proteinPercentage: 3.3, 
        milkerName: 'Carlos M.', 
        createdAt: Date.now() 
      }
    );
  }
  await db.milkingRecords.bulkPut(milkRecords);

  // 8. Weight Records (For Steer Titan - Shows daily gain)
  const weightRecords: WeightRecord[] = [
    { 
      id: 'w-103-1', 
      animalId: 'steer-103', 
      date: '2026-09-15', 
      weightKg: 370, 
      source: 'bluetooth_scale', 
      createdAt: Date.now() 
    },
    { 
      id: 'w-103-2', 
      animalId: 'steer-103', 
      date: '2026-11-15', 
      weightKg: 420, 
      averageDailyGainKg: 0.82, 
      source: 'bluetooth_scale', 
      createdAt: Date.now() 
    }
  ];
  await db.weightRecords.bulkPut(weightRecords);

  // 9. Single Health Record (Vaccine for Cow Mariposa)
  const healthRecords: HealthRecord[] = [
    {
      id: 'health-1',
      animalId: 'cow-101',
      date: '2026-10-10',
      type: 'vaccine',
      treatmentName: 'Aftogan (Fiebre Aftosa)',
      batchNumber: 'AFT-2026-04',
      doseMl: 2.0,
      administrationRoute: 'subcutaneous',
      veterinarianName: 'Dr. Ricardo Rivas',
      withdrawalDaysMilk: 0,
      withdrawalDaysMeat: 0,
      cost: 4.5,
      createdAt: Date.now()
    }
  ];
  await db.healthRecords.bulkPut(healthRecords);

  // 10. Simple Financial Summary for Hacienda La Pradera
  const financialRecords: FinancialRecord[] = [
    { 
      id: 'fin-1', 
      farmId: 'farm-1', 
      date: '2026-11-01', 
      type: 'income', 
      category: 'milk_sale', 
      description: 'Venta quincenal de leche a cooperativa (1,850 L)', 
      amount: 1073.00, 
      quantity: 1850, 
      unitPrice: 0.58, 
      paymentMethod: 'transfer', 
      createdAt: Date.now() 
    },
    { 
      id: 'fin-2', 
      farmId: 'farm-1', 
      date: '2026-11-05', 
      type: 'expense', 
      category: 'feed_supplement', 
      description: 'Concentrado lechero y sales minerales', 
      amount: 320.00, 
      paymentMethod: 'cash', 
      createdAt: Date.now() 
    }
  ];
  await db.financialRecords.bulkPut(financialRecords);

  console.log('Lean minimal seed completed: 1 farm, 3 animals.');
}
