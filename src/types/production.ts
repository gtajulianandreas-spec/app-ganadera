export interface MilkingRecord {
  id: string;
  farmId?: string;
  animalId: string;
  date: string; // YYYY-MM-DD
  shift: 'AM' | 'PM' | 'NOON';
  liters: number;
  fatPercentage?: number;
  proteinPercentage?: number;
  somaticCellCount?: number;
  calfConsumptionLiters?: number;
  milkerName?: string;
  notes?: string;
  createdAt: number;
}

export interface WeightRecord {
  id: string;
  farmId?: string;
  animalId: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  averageDailyGainKg?: number; // ADG / GDP
  bodyConditionScore?: number; // 1-5 or 1-9
  source: 'manual' | 'bluetooth_scale' | 'tape_estimate';
  notes?: string;
  createdAt: number;
}

export type DoseUnit = 'ml' | 'cc' | 'mg' | 'g' | 'dosis' | 'tableta' | 'frasco' | 'spray';

export interface HealthRecord {
  id: string;
  farmId?: string;
  animalId: string;
  date: string;
  type: 'vaccine' | 'treatment' | 'antiparasitic' | 'mastitis' | 'castration' | 'checkup';
  diagnosis?: string;
  treatmentName: string;
  batchNumber?: string;
  expirationDate?: string;
  doseAmount?: number;
  doseUnit?: DoseUnit;
  doseMl?: number; // compatibilidad previa
  administrationRoute?: 'subcutaneous' | 'intramuscular' | 'intravenous' | 'topical' | 'intramammary' | 'oral' | 'pour-on';
  veterinarianName?: string;
  affectedQuarters?: {
    leftFront: boolean;
    rightFront: boolean;
    leftRear: boolean;
    rightRear: boolean;
  };
  withdrawalDaysMilk: number;
  withdrawalDaysMeat: number;
  safeMilkDate?: string;
  safeMeatDate?: string;
  cost?: number;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  createdAt: number;
}
