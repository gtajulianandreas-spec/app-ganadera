import type { Animal } from '../types/animal';
import type { ReproductionEvent } from '../types/reproduction';

export class ReproductionEngine {
  // Returns gestation days according to species and breed
  public static getGestationPeriodDays(species: string, breedComposition?: Animal['breedComposition']): number {
    if (species === 'buffalo') return 310;
    if (species === 'ovine' || species === 'caprine') return 150;
    if (species === 'porcine') return 114;
    if (species === 'equine') return 335;

    // Bovines: distinguish Bos indicus (Zebu/Brahman/Gyr ~292 days) vs Bos taurus (Holstein/Jersey/Angus ~283 days)
    if (breedComposition && breedComposition.length > 0) {
      const zebuBreeds = ['brahman', 'gyr', 'guzerat', 'nelore', 'indubrasil', 'sindi'];
      const hasZebu = breedComposition.some(b => 
        zebuBreeds.some(z => b.breedName.toLowerCase().includes(z)) && b.percentage >= 50
      );
      if (hasZebu) return 292;
    }

    return 283; // Standard Bos taurus
  }

  // Calculate estimated calving and mandatory dry-off dates
  public static calculateDates(
    inseminationDateStr: string,
    species: string = 'bovine',
    breedComposition?: Animal['breedComposition']
  ): { projectedCalvingDate: string; mandatoryDryOffDate: string } {
    const baseDate = new Date(inseminationDateStr);
    const gestationDays = this.getGestationPeriodDays(species, breedComposition);

    // Calving date = Insemination + Gestation days
    const calvingDate = new Date(baseDate);
    calvingDate.setDate(calvingDate.getDate() + gestationDays);

    // Mandatory dry-off = Calving date - 60 days
    const dryOffDate = new Date(calvingDate);
    dryOffDate.setDate(dryOffDate.getDate() - 60);

    return {
      projectedCalvingDate: calvingDate.toISOString().split('T')[0],
      mandatoryDryOffDate: dryOffDate.toISOString().split('T')[0]
    };
  }

  // Check if a female is in the window for potential recurrent heat (18-24 days post-insemination)
  public static isHeatAlertWindow(lastInseminationDateStr: string): { inWindow: boolean; daysAgo: number } {
    const lastDate = new Date(lastInseminationDateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const inWindow = daysAgo >= 18 && daysAgo <= 24;
    return { inWindow, daysAgo };
  }

  // Calculate Calving Interval (IEP - Intervalo Entre Partos) in days
  public static calculateCalvingIntervalDays(calvingDates: string[]): number | null {
    if (calvingDates.length < 2) return null;
    const sorted = [...calvingDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const d1 = new Date(sorted[0]);
    const d2 = new Date(sorted[1]);
    const diffTime = Math.abs(d1.getTime() - d2.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}
