export type ReproductionEventType = 
  | 'heat'
  | 'insemination'
  | 'bull_service'
  | 'pregnancy_check'
  | 'calving'
  | 'abortion'
  | 'dry_off';

export type PregnancyResult = 'pregnant' | 'open' | 'doubtful';

export interface ReproductionEvent {
  id: string; // UUIDv7
  farmId?: string;
  animalId: string;
  eventType: ReproductionEventType;
  date: string; // YYYY-MM-DD
  sireId?: string; // bull or straw code
  sireBreed?: string;
  semenStrawBatch?: string;
  technicianName?: string;
  method?: 'artificial_insemination' | 'natural_service' | 'embryo_transfer';
  pregnancyResult?: PregnancyResult;
  daysPregnant?: number;
  projectedCalvingDate?: string; // YYYY-MM-DD
  mandatoryDryOffDate?: string; // YYYY-MM-DD
  dryOffTherapyProduct?: string; // e.g. "Cefalonio intramamario + Sellador de pezones"
  dryOffStatus?: 'planned' | 'active_drying' | 'completed';
  calvingEase?: 'easy' | 'assisted' | 'cesarean' | 'dystocic';
  calfId?: string;
  calfGender?: 'female' | 'male';
  calfWeightKg?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
