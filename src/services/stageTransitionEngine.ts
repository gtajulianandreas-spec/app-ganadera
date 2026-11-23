import type { Animal, LifeStage, StageTransitionConfig } from '../types/animal';
import { db } from '../db';
import { syncEngine } from '../sync/engine';

export const DEFAULT_STAGE_CONFIG: StageTransitionConfig = {
  calfMaxMonths: 7,      // 0 a 7 meses: Ternero / Ternera lactante
  weanedMaxMonths: 14,   // 7 a 14 meses: Levante / Destete
  juvenileMaxMonths: 24  // 14 a 24 meses: Novillo / Novilla de reemplazo
  // > 24 meses: Adulto (Vaca / Toro)
};

export interface StageTransitionCandidate {
  animal: Animal;
  ageMonths: number;
  ageDays: number;
  currentStage: LifeStage;
  recommendedStage: LifeStage;
  reason: string;
}

export class StageTransitionEngine {
  /**
   * Calculates age in months and days between birthDate and today.
   */
  static calculateAge(birthDateStr: string, referenceDate: Date = new Date()): { months: number; days: number } {
    const birth = new Date(birthDateStr);
    const now = referenceDate;

    let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) {
      months -= 1;
    }
    const diffTime = Math.max(0, now.getTime() - birth.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return { months: Math.max(0, months), days };
  }

  /**
   * Evaluates which life stage corresponds to an animal based on age and config.
   */
  static getRecommendedStage(ageMonths: number, config: StageTransitionConfig = DEFAULT_STAGE_CONFIG): LifeStage {
    if (ageMonths <= config.calfMaxMonths) {
      return 'calf';
    }
    if (ageMonths <= config.weanedMaxMonths) {
      return 'weaned';
    }
    if (ageMonths <= config.juvenileMaxMonths) {
      return 'juvenile';
    }
    return 'adult';
  }

  /**
   * Formats life stage name in Spanish.
   */
  static getStageLabel(stage: LifeStage, gender: 'female' | 'male' | 'castrated' = 'female'): string {
    switch (stage) {
      case 'calf':
        return gender === 'female' ? 'Ternera (Lactante)' : 'Ternero (Lactante)';
      case 'weaned':
        return 'Levante / Desteto';
      case 'juvenile':
        return gender === 'female' ? 'Novilla de Vientre' : 'Novillo de Ceba';
      case 'adult':
        return gender === 'female' ? 'Vaca Adulta' : 'Toro Reproductor';
    }
  }

  /**
   * Identifies all animals in the given list that are ready to transition to their next stage.
   */
  static findTransitionCandidates(
    animals: Animal[],
    config: StageTransitionConfig = DEFAULT_STAGE_CONFIG
  ): StageTransitionCandidate[] {
    const candidates: StageTransitionCandidate[] = [];

    for (const animal of animals) {
      if (animal.status !== 'active' || !animal.birthDate) continue;

      const { months, days } = this.calculateAge(animal.birthDate);
      const recommended = this.getRecommendedStage(months, config);

      if (animal.currentStage !== recommended) {
        const fromLabel = this.getStageLabel(animal.currentStage, animal.gender);
        const toLabel = this.getStageLabel(recommended, animal.gender);
        candidates.push({
          animal,
          ageMonths: months,
          ageDays: days,
          currentStage: animal.currentStage,
          recommendedStage: recommended,
          reason: `Tiene ${months} meses (${days} días). Corresponde avanzar de ${fromLabel} a ${toLabel}.`
        });
      }
    }

    return candidates;
  }

  /**
   * Applies the recommended stage transitions to selected animals in database.
   */
  static async applyTransitions(candidates: StageTransitionCandidate[]): Promise<number> {
    let count = 0;
    const now = Date.now();

    for (const candidate of candidates) {
      const updatedAnimal: Animal = {
        ...candidate.animal,
        currentStage: candidate.recommendedStage,
        updatedAt: now,
        version: (candidate.animal.version || 1) + 1
      };

      await db.animals.put(updatedAnimal);
      await syncEngine.queueAction('animal', 'update', updatedAnimal.id, updatedAnimal);
      count++;
    }

    return count;
  }
}
