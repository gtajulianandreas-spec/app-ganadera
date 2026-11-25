import type { ImageFeatureVector } from '../services/visualSearchService';

export interface StageTransitionConfig {
  calfMaxMonths: number;      // e.g. 7 meses: de 0 a 7 meses es ternero
  weanedMaxMonths: number;    // e.g. 14 meses: de 7 a 14 meses es destete / levante
  juvenileMaxMonths: number;  // e.g. 24 meses: de 14 a 24 meses es novillo / ceba
  // Mayor a juvenileMaxMonths se considera adulto
}

export interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  altitudeMeters?: number;
  recordedAt: number;
}

export interface Farm {
  id: string;
  name: string;
  ownerName: string;
  location?: string;
  country: string;
  currency: string;
  areaHectares: number;
  cattleBreedDefault?: string;
  purpose: 'milk' | 'beef' | 'dual_purpose' | 'mixed';
  photoUrl?: string;
  stageConfig?: StageTransitionConfig;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: number;
  updatedAt: number;
}

export type Species = 'bovine' | 'buffalo' | 'equine' | 'porcine' | 'ovine' | 'caprine';
export type Gender = 'female' | 'male' | 'castrated';
export type LifeStage = 'calf' | 'weaned' | 'juvenile' | 'adult';
export type AnimalPurpose = 'milk' | 'beef' | 'dual_purpose' | 'breeding' | 'work';
export type AnimalStatus = 'active' | 'sold' | 'deceased' | 'transferred' | 'quarantined';

export interface BreedComposition {
  breedId: string;
  breedName: string;
  percentage: number; // e.g. 50, 100
}

export interface Animal {
  id: string; // UUIDv7
  earTagCode: string; // e.g. "CG-104", "04-9218"
  electronicId?: string; // RFID / Chip / NFC ISO code
  name?: string;
  species: Species;
  gender: Gender;
  birthDate: string; // ISO format: YYYY-MM-DD
  birthWeightKg?: number;
  currentWeightKg?: number;
  currentStage: LifeStage;
  purpose: AnimalPurpose;
  breedComposition: BreedComposition[];
  farmId: string;
  lotId?: string;
  pastureId?: string;
  status: AnimalStatus;
  motherId?: string;
  fatherId?: string;
  photoUrl?: string;
  photoFeatures?: ImageFeatureVector;
  qrCode?: string;
  gpsCoordinates?: GpsLocation;
  notes?: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  version: number;
}

export interface Lot {
  id: string;
  farmId: string;
  name: string;
  purpose: AnimalPurpose;
  color?: string;
  pastureId?: string;
  notes?: string;
  updatedAt: number;
}

export interface Pasture {
  id: string;
  farmId: string;
  name: string;
  areaHectares: number;
  grassType: string;
  capacityAnimalUnits: number;
  restingDays: number;
  lastRotatedDate?: string;
  status: 'occupied' | 'resting' | 'recovery';
  updatedAt: number;
}
