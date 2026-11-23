import { db } from './index';
import type { Animal, Lot, Pasture, Farm } from '../types/animal';
import type { ReproductionEvent } from '../types/reproduction';
import type { MilkingRecord, WeightRecord, HealthRecord } from '../types/production';
import type { FinancialRecord } from '../types/finance';
import { samplePhotos } from '../services/samplePhotos';

export async function seedDemoDataIfEmpty() {
  console.log('Checking / Seeding farm and cattle demo dataset...');

  // 1. Seed Multi-Farms
  const farmCount = await db.farms.count();
  if (farmCount === 0) {
    const demoFarms: Farm[] = [
      {
        id: 'farm-1',
        name: 'Hacienda La Pradera',
        ownerName: 'Juan Carlos Gómez',
        location: 'Valle de Ubaté, Cundinamarca',
        country: 'Colombia',
        currency: 'USD',
        areaHectares: 120,
        cattleBreedDefault: 'Girolando / Holstein',
        purpose: 'milk',
        createdAt: Date.now() - 365 * 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'farm-2',
        name: 'Rancho El Porvenir',
        ownerName: 'Alejandro Restrepo',
        location: 'Puerto López, Meta',
        country: 'Colombia',
        currency: 'USD',
        areaHectares: 240,
        cattleBreedDefault: 'Black Angus / Brahman',
        purpose: 'beef',
        createdAt: Date.now() - 200 * 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'farm-3',
        name: 'Finca Santa Inés',
        ownerName: 'Dra. María Elena Díaz',
        location: 'Montería, Córdoba',
        country: 'Colombia',
        currency: 'USD',
        areaHectares: 95,
        cattleBreedDefault: 'Gyr Lechero / Guzerá',
        purpose: 'dual_purpose',
        createdAt: Date.now() - 150 * 86400000,
        updatedAt: Date.now()
      }
    ];
    await db.farms.bulkPut(demoFarms);
  }

  // 2. Settings
  await db.settings.put({
    id: 'default_farm',
    farmName: 'Hacienda La Pradera',
    ownerName: 'Juan Carlos Gómez',
    country: 'Colombia',
    currency: 'USD',
    areaHectares: 120,
    cattleBreedDefault: 'Girolando',
    autoBackupIntervalHours: 24,
    lanSyncEnabled: true,
  });

  // 3. Pastures for each farm
  const pastures: Pasture[] = [
    // Farm 1 (La Pradera)
    { id: 'pas-1', farmId: 'farm-1', name: 'Potrero 1 - El Rodeo', areaHectares: 25, grassType: 'Brachiaria Brizantha', capacityAnimalUnits: 35, restingDays: 28, status: 'occupied', updatedAt: Date.now() },
    { id: 'pas-2', farmId: 'farm-1', name: 'Potrero 2 - La Ceiba', areaHectares: 30, grassType: 'Mombaza / Panicum', capacityAnimalUnits: 45, restingDays: 32, status: 'occupied', updatedAt: Date.now() },
    { id: 'pas-3', farmId: 'farm-1', name: 'Potrero 3 - El Valle', areaHectares: 35, grassType: 'Estrella Africana', capacityAnimalUnits: 50, restingDays: 24, status: 'resting', updatedAt: Date.now() },
    { id: 'pas-4', farmId: 'farm-1', name: 'Potrero 4 - Los Pinos', areaHectares: 30, grassType: 'Brachiaria Decumbens', capacityAnimalUnits: 40, restingDays: 30, status: 'recovery', updatedAt: Date.now() },
    // Farm 2 (El Porvenir)
    { id: 'pas-201', farmId: 'farm-2', name: 'Sabana Alta - Lote Ceba', areaHectares: 120, grassType: 'Brachiaria Humidicola', capacityAnimalUnits: 150, restingDays: 35, status: 'occupied', updatedAt: Date.now() },
    { id: 'pas-202', farmId: 'farm-2', name: 'Bajo de los Morichales', areaHectares: 120, grassType: 'Dictyoneura', capacityAnimalUnits: 130, restingDays: 25, status: 'resting', updatedAt: Date.now() },
    // Farm 3 (Santa Inés)
    { id: 'pas-301', farmId: 'farm-3', name: 'Potrero Río Sinú', areaHectares: 50, grassType: 'Pará / Angleton', capacityAnimalUnits: 70, restingDays: 21, status: 'occupied', updatedAt: Date.now() },
  ];
  await db.pastures.bulkPut(pastures);

  // 4. Lots for each farm
  const lots: Lot[] = [
    // Farm 1
    { id: 'lot-1', farmId: 'farm-1', name: 'Lote 1: Alta Producción Leche', purpose: 'milk', color: '#10b981', pastureId: 'pas-1', updatedAt: Date.now() },
    { id: 'lot-2', farmId: 'farm-1', name: 'Lote 2: Media Producción', purpose: 'milk', color: '#3b82f6', pastureId: 'pas-2', updatedAt: Date.now() },
    { id: 'lot-3', farmId: 'farm-1', name: 'Lote 3: Vacas Secas y Preñadas', purpose: 'breeding', color: '#f59e0b', pastureId: 'pas-3', updatedAt: Date.now() },
    // Farm 2
    { id: 'lot-4', farmId: 'farm-2', name: 'Lote Ceba Intensiva Novillos', purpose: 'beef', color: '#8b5cf6', pastureId: 'pas-201', updatedAt: Date.now() },
    { id: 'lot-5', farmId: 'farm-2', name: 'Lote Toros Reproductores Cárnicos', purpose: 'breeding', color: '#ef4444', pastureId: 'pas-202', updatedAt: Date.now() },
    // Farm 3
    { id: 'lot-6', farmId: 'farm-3', name: 'Lote Vacas Doble Propósito Gyr', purpose: 'dual_purpose', color: '#06b6d4', pastureId: 'pas-301', updatedAt: Date.now() }
  ];
  await db.lots.bulkPut(lots);

  // 5. Animals with photos across farms
  const animals: Animal[] = [
    // FARM 1: Hacienda La Pradera
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
      breedComposition: [{ breedId: 'holstein', breedName: 'Holstein', percentage: 75 }, { breedId: 'gyr', breedName: 'Gyr Lechero', percentage: 25 }],
      farmId: 'farm-1',
      lotId: 'lot-1',
      pastureId: 'pas-1',
      status: 'active',
      photoUrl: samplePhotos.holstein('HLP-101'),
      notes: 'Excelente productora, 3er parto, ubres bien insertadas',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    },
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
      purpose: 'milk',
      breedComposition: [{ breedId: 'girolando', breedName: 'Girolando', percentage: 100 }],
      farmId: 'farm-1',
      lotId: 'lot-1',
      pastureId: 'pas-1',
      status: 'active',
      photoUrl: samplePhotos.holstein('HLP-102'),
      notes: 'Pico de lactancia en 26 L/día',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    },
    {
      id: 'cow-103',
      earTagCode: 'HLP-103',
      electronicId: '982000412891003',
      name: 'Campanera',
      species: 'bovine',
      gender: 'female',
      birthDate: '2021-11-05',
      birthWeightKg: 35,
      currentWeightKg: 520,
      currentStage: 'adult',
      purpose: 'milk',
      breedComposition: [{ breedId: 'holstein', breedName: 'Holstein', percentage: 100 }],
      farmId: 'farm-1',
      lotId: 'lot-1',
      pastureId: 'pas-1',
      status: 'active',
      photoUrl: samplePhotos.holstein('HLP-103'),
      notes: 'Preñada de 7 meses, próxima a secado',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    },
    {
      id: 'cow-104',
      earTagCode: 'HLP-104',
      electronicId: '982000412891004',
      name: 'Paloma',
      species: 'bovine',
      gender: 'female',
      birthDate: '2019-06-10',
      birthWeightKg: 40,
      currentWeightKg: 610,
      currentStage: 'adult',
      purpose: 'breeding',
      breedComposition: [{ breedId: 'brahman', breedName: 'Brahman Blanco', percentage: 100 }],
      farmId: 'farm-1',
      lotId: 'lot-3',
      pastureId: 'pas-3',
      status: 'active',
      photoUrl: samplePhotos.brahman('HLP-104', 'white'),
      notes: 'Vaca seca confirmada, parto estimado en 25 días',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    },
    {
      id: 'cow-105',
      earTagCode: 'HLP-105',
      electronicId: '982000412891005',
      name: 'Lucero',
      species: 'bovine',
      gender: 'female',
      birthDate: '2022-01-18',
      birthWeightKg: 34,
      currentWeightKg: 495,
      currentStage: 'adult',
      purpose: 'milk',
      breedComposition: [{ breedId: 'jersey', breedName: 'Jersey', percentage: 100 }],
      farmId: 'farm-1',
      lotId: 'lot-2',
      pastureId: 'pas-2',
      status: 'active',
      photoUrl: samplePhotos.jersey('HLP-105'),
      notes: 'Alta concentración de grasa (4.6%)',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    },
    {
      id: 'bull-201',
      earTagCode: 'HLP-201',
      electronicId: '982000412891201',
      name: 'Titan de la Pradera',
      species: 'bovine',
      gender: 'male',
      birthDate: '2020-04-12',
      birthWeightKg: 44,
      currentWeightKg: 890,
      currentStage: 'adult',
      purpose: 'breeding',
      breedComposition: [{ breedId: 'brahman', breedName: 'Brahman Rojo', percentage: 100 }],
      farmId: 'farm-1',
      status: 'active',
      photoUrl: samplePhotos.brahman('HLP-201', 'red'),
      notes: 'Toro reproductor principal, prueba andrológica 95%',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    },

    // FARM 2: Rancho El Porvenir (Carne & Ceba)
    {
      id: 'steer-301',
      earTagCode: 'RPV-301',
      electronicId: '982000412891301',
      name: 'Novillo 301',
      species: 'bovine',
      gender: 'castrated',
      birthDate: '2025-02-10',
      birthWeightKg: 37,
      currentWeightKg: 415,
      currentStage: 'juvenile',
      purpose: 'beef',
      breedComposition: [{ breedId: 'angus', breedName: 'Black Angus', percentage: 50 }, { breedId: 'brahman', breedName: 'Brahman', percentage: 50 }],
      farmId: 'farm-2',
      lotId: 'lot-4',
      pastureId: 'pas-201',
      status: 'active',
      photoUrl: samplePhotos.angus('RPV-301'),
      notes: 'Lote de ceba, ganancia 1.15 kg/día',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    },
    {
      id: 'steer-302',
      earTagCode: 'RPV-302',
      electronicId: '982000412891302',
      name: 'Novillo 302',
      species: 'bovine',
      gender: 'castrated',
      birthDate: '2025-02-15',
      birthWeightKg: 38,
      currentWeightKg: 428,
      currentStage: 'juvenile',
      purpose: 'beef',
      breedComposition: [{ breedId: 'angus', breedName: 'Black Angus', percentage: 50 }, { breedId: 'brahman', breedName: 'Brahman', percentage: 50 }],
      farmId: 'farm-2',
      lotId: 'lot-4',
      pastureId: 'pas-201',
      status: 'active',
      photoUrl: samplePhotos.angus('RPV-302'),
      notes: 'Lote de ceba intensiva con suplemento proteico',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    },
    {
      id: 'bull-202',
      earTagCode: 'RPV-202',
      electronicId: '982000412891202',
      name: 'Rey del Llano',
      species: 'bovine',
      gender: 'male',
      birthDate: '2021-08-10',
      birthWeightKg: 42,
      currentWeightKg: 915,
      currentStage: 'adult',
      purpose: 'breeding',
      breedComposition: [{ breedId: 'brahman', breedName: 'Brahman Blanco Purasangre', percentage: 100 }],
      farmId: 'farm-2',
      lotId: 'lot-5',
      pastureId: 'pas-202',
      status: 'active',
      photoUrl: samplePhotos.brahman('RPV-202', 'white'),
      notes: 'Gran Campeón en Feria Agropecuaria de Villavicencio',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    },

    // FARM 3: Finca Santa Inés (Doble Propósito)
    {
      id: 'cow-106',
      earTagCode: 'FSI-106',
      electronicId: '982000412891006',
      name: 'Princesa Gyr',
      species: 'bovine',
      gender: 'female',
      birthDate: '2021-05-12',
      birthWeightKg: 35,
      currentWeightKg: 490,
      currentStage: 'adult',
      purpose: 'dual_purpose',
      breedComposition: [{ breedId: 'gyr', breedName: 'Gyr Lechero', percentage: 100 }],
      farmId: 'farm-3',
      lotId: 'lot-6',
      pastureId: 'pas-301',
      status: 'active',
      photoUrl: samplePhotos.brahman('FSI-106', 'red'),
      notes: 'Madre probada, alta rusticidad y resistencia a garrapatas',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    }
  ];
  await db.animals.bulkPut(animals);

  // 6. Reproduction Events
  const reproEvents: ReproductionEvent[] = [
    {
      id: 'rep-1',
      animalId: 'cow-103',
      eventType: 'insemination',
      date: '2026-04-10',
      sireId: 'STRAW-HOL-882',
      sireBreed: 'Holstein Canadiense',
      technicianName: 'Dr. Ricardo Rivas',
      method: 'artificial_insemination',
      projectedCalvingDate: '2027-01-18',
      mandatoryDryOffDate: '2026-11-19',
      notes: 'Pajilla sexada hembra',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'rep-2',
      animalId: 'cow-103',
      eventType: 'pregnancy_check',
      date: '2026-06-15',
      pregnancyResult: 'pregnant',
      daysPregnant: 66,
      technicianName: 'Dr. Ricardo Rivas',
      notes: 'Confirmado por ecografía, feto viable',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'rep-3',
      animalId: 'cow-104',
      eventType: 'insemination',
      date: '2026-03-01',
      sireId: 'HLP-201',
      method: 'natural_service',
      projectedCalvingDate: '2026-12-18',
      mandatoryDryOffDate: '2026-10-19',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'rep-4',
      animalId: 'cow-104',
      eventType: 'dry_off',
      date: '2026-10-18',
      notes: 'Secado con sellador interno de pezones y antibiótico preventivo',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];
  await db.reproductionEvents.bulkPut(reproEvents);

  // 7. Milking Records
  const milkRecords: MilkingRecord[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    milkRecords.push(
      { id: `milk-101-am-${i}`, animalId: 'cow-101', date: dateStr, shift: 'AM', liters: 14.5 + Math.random() * 2, fatPercentage: 3.8, proteinPercentage: 3.2, calfConsumptionLiters: 2.0, milkerName: 'Carlos M.', createdAt: Date.now() },
      { id: `milk-101-pm-${i}`, animalId: 'cow-101', date: dateStr, shift: 'PM', liters: 10.2 + Math.random() * 1.5, fatPercentage: 3.9, proteinPercentage: 3.3, milkerName: 'Carlos M.', createdAt: Date.now() },
      { id: `milk-102-am-${i}`, animalId: 'cow-102', date: dateStr, shift: 'AM', liters: 15.8 + Math.random() * 2, fatPercentage: 4.1, proteinPercentage: 3.4, calfConsumptionLiters: 2.5, milkerName: 'Carlos M.', createdAt: Date.now() },
      { id: `milk-102-pm-${i}`, animalId: 'cow-102', date: dateStr, shift: 'PM', liters: 11.5 + Math.random() * 1.5, fatPercentage: 4.2, proteinPercentage: 3.5, milkerName: 'Carlos M.', createdAt: Date.now() },
      { id: `milk-105-am-${i}`, animalId: 'cow-105', date: dateStr, shift: 'AM', liters: 11.2 + Math.random() * 1.5, fatPercentage: 4.6, proteinPercentage: 3.7, milkerName: 'Carlos M.', createdAt: Date.now() },
      { id: `milk-106-am-${i}`, animalId: 'cow-106', date: dateStr, shift: 'AM', liters: 9.8 + Math.random() * 1.2, fatPercentage: 4.3, proteinPercentage: 3.5, milkerName: 'Ramón V.', createdAt: Date.now() }
    );
  }
  await db.milkingRecords.bulkPut(milkRecords);

  // 8. Weight Records
  const weightRecords: WeightRecord[] = [
    { id: 'w-301-1', animalId: 'steer-301', date: '2026-09-20', weightKg: 345, source: 'bluetooth_scale', createdAt: Date.now() },
    { id: 'w-301-2', animalId: 'steer-301', date: '2026-11-20', weightKg: 415, averageDailyGainKg: 1.15, source: 'bluetooth_scale', createdAt: Date.now() },
    { id: 'w-302-1', animalId: 'steer-302', date: '2026-09-20', weightKg: 352, source: 'bluetooth_scale', createdAt: Date.now() },
    { id: 'w-302-2', animalId: 'steer-302', date: '2026-11-20', weightKg: 428, averageDailyGainKg: 1.24, source: 'bluetooth_scale', createdAt: Date.now() },
  ];
  await db.weightRecords.bulkPut(weightRecords);

  // 9. Health Records
  const healthRecords: HealthRecord[] = [
    {
      id: 'health-1',
      animalId: 'cow-101',
      date: '2026-10-05',
      type: 'vaccine',
      treatmentName: 'Aftogan (Fiebre Aftosa Bivalente)',
      batchNumber: 'AFT-2026-90',
      doseMl: 2.0,
      administrationRoute: 'subcutaneous',
      veterinarianName: 'Dr. Ricardo Rivas',
      withdrawalDaysMilk: 0,
      withdrawalDaysMeat: 0,
      cost: 4.5,
      createdAt: Date.now()
    },
    {
      id: 'health-2',
      animalId: 'steer-301',
      date: '2026-10-12',
      type: 'antiparasitic',
      treatmentName: 'Ivermectina 3.15% L.A.',
      doseMl: 8.0,
      administrationRoute: 'subcutaneous',
      veterinarianName: 'Dr. Ricardo Rivas',
      withdrawalDaysMilk: 28,
      withdrawalDaysMeat: 35,
      safeMeatDate: '2026-11-16',
      cost: 12.0,
      createdAt: Date.now()
    }
  ];
  await db.healthRecords.bulkPut(healthRecords);

  // 10. Financial Records by Farm
  const financialRecords: FinancialRecord[] = [
    // Farm 1 (La Pradera)
    { id: 'fin-1', farmId: 'farm-1', date: '2026-11-01', type: 'income', category: 'milk_sale', description: 'Venta quincena leche a Cooperativa Lechera (3,850 L a $0.58/L)', amount: 2233.00, quantity: 3850, unitPrice: 0.58, paymentMethod: 'transfer', createdAt: Date.now() },
    { id: 'fin-2', farmId: 'farm-1', date: '2026-11-15', type: 'income', category: 'milk_sale', description: 'Venta segunda quincena leche (4,120 L a $0.58/L)', amount: 2389.60, quantity: 4120, unitPrice: 0.58, paymentMethod: 'transfer', createdAt: Date.now() },
    { id: 'fin-3', farmId: 'farm-1', date: '2026-11-08', type: 'income', category: 'animal_sale', description: 'Venta 2 toretes de descarte (980 kg en pie a $2.10/kg)', amount: 2058.00, quantity: 980, unitPrice: 2.10, paymentMethod: 'transfer', createdAt: Date.now() },
    { id: 'fin-4', farmId: 'farm-1', date: '2026-11-02', type: 'expense', category: 'feed_supplement', description: 'Concentrado comercial 18% Proteína (40 bultos)', amount: 760.00, quantity: 40, unitPrice: 19.00, paymentMethod: 'cash', createdAt: Date.now() },
    { id: 'fin-5', farmId: 'farm-1', date: '2026-11-05', type: 'expense', category: 'veterinary_medicine', description: 'Lote de biológicos y sales mineralizadas', amount: 320.00, paymentMethod: 'transfer', createdAt: Date.now() },
    { id: 'fin-6', farmId: 'farm-1', date: '2026-11-15', type: 'expense', category: 'labor_payroll', description: 'Pago de nómina quincenal operadores de ordeño y campo', amount: 850.00, paymentMethod: 'transfer', createdAt: Date.now() },
    { id: 'fin-7', farmId: 'farm-1', date: '2026-11-18', type: 'expense', category: 'pasture_fertilizer', description: 'Fertilizante Urea + Sulfato de Amonio para Potrero 3', amount: 480.00, paymentMethod: 'transfer', createdAt: Date.now() },

    // Farm 2 (El Porvenir - Ceba)
    { id: 'fin-201', farmId: 'farm-2', date: '2026-11-10', type: 'income', category: 'animal_sale', description: 'Venta lote 8 novillos gordos terminados (3,680 kg a $2.25/kg)', amount: 8280.00, quantity: 3680, unitPrice: 2.25, paymentMethod: 'transfer', createdAt: Date.now() },
    { id: 'fin-202', farmId: 'farm-2', date: '2026-11-04', type: 'expense', category: 'feed_supplement', description: 'Sal mineralizada al 8% fósforo + bloque nutricional melaza-urea', amount: 1150.00, paymentMethod: 'transfer', createdAt: Date.now() },
    { id: 'fin-203', farmId: 'farm-2', date: '2026-11-14', type: 'expense', category: 'labor_payroll', description: 'Nómina vaqueros y tractorista sabana', amount: 1200.00, paymentMethod: 'transfer', createdAt: Date.now() },

    // Farm 3 (Santa Inés)
    { id: 'fin-301', farmId: 'farm-3', date: '2026-11-12', type: 'income', category: 'milk_sale', description: 'Venta leche cruda quesera local (1,450 L a $0.52/L)', amount: 754.00, quantity: 1450, unitPrice: 0.52, paymentMethod: 'cash', createdAt: Date.now() },
    { id: 'fin-302', farmId: 'farm-3', date: '2026-11-16', type: 'expense', category: 'veterinary_medicine', description: 'Baño acaricida para control de garrapatas y moscas', amount: 180.00, paymentMethod: 'cash', createdAt: Date.now() }
  ];
  await db.financialRecords.bulkPut(financialRecords);

  console.log('Seed with multi-farms and photos completed successfully!');
}
