import type { FinancialRecord, UnitEconomicsSummary } from '../types/finance';
import type { MilkingRecord, WeightRecord } from '../types/production';

export class FinancialEngine {
  public static calculateUnitEconomics(
    financials: FinancialRecord[],
    milkings: MilkingRecord[],
    weights: WeightRecord[]
  ): UnitEconomicsSummary {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalMilkRevenue = 0;
    let totalBeefRevenue = 0;

    let feedCost = 0;
    let vetCost = 0;
    let laborCost = 0;
    let pastureCost = 0;
    let otherCost = 0;

    for (const rec of financials) {
      if (rec.type === 'income') {
        totalIncome += rec.amount;
        if (rec.category === 'milk_sale') totalMilkRevenue += rec.amount;
        if (rec.category === 'animal_sale') totalBeefRevenue += rec.amount;
      } else {
        totalExpense += rec.amount;
        if (rec.category === 'feed_supplement') feedCost += rec.amount;
        else if (rec.category === 'veterinary_medicine') vetCost += rec.amount;
        else if (rec.category === 'labor_payroll') laborCost += rec.amount;
        else if (rec.category === 'pasture_fertilizer') pastureCost += rec.amount;
        else otherCost += rec.amount;
      }
    }

    // Total milk production in liters
    const totalMilkProducedLiters = milkings.reduce((sum, m) => sum + m.liters, 0);

    // Approximate cost allocation: 60% of operating expenses to dairy, 40% to beef
    const totalCostMilkProduction = (feedCost * 0.7) + (laborCost * 0.6) + (vetCost * 0.5) + (pastureCost * 0.5);
    const totalCostBeefProduction = (feedCost * 0.3) + (laborCost * 0.4) + (vetCost * 0.5) + (pastureCost * 0.5);

    // Cost per liter of milk
    const costPerLiterMilk = totalMilkProducedLiters > 0 
      ? totalCostMilkProduction / totalMilkProducedLiters 
      : 0;

    const avgMilkPrice = totalMilkProducedLiters > 0 && totalMilkRevenue > 0
      ? totalMilkRevenue / totalMilkProducedLiters
      : 0.58; // fallback market price

    const grossMarginPerLiterMilk = avgMilkPrice - costPerLiterMilk;

    // Weight gain calculations from weight records with ADG
    const validGains = weights.filter(w => (w.averageDailyGainKg || 0) > 0);
    const totalBeefProducedKg = validGains.reduce((sum, w) => sum + ((w.averageDailyGainKg || 0) * 30), 0) || 1200; // estimated monthly kg gained

    const costPerKgGain = totalBeefProducedKg > 0
      ? totalCostBeefProduction / totalBeefProducedKg
      : 0;

    const avgBeefPrice = totalBeefRevenue > 0 && totalBeefProducedKg > 0
      ? totalBeefRevenue / totalBeefProducedKg
      : 2.10; // fallback market price per kg in pie

    const grossMarginPerKgBeef = avgBeefPrice - costPerKgGain;

    const netProfit = totalIncome - totalExpense;
    const profitMarginPercent = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Break-even milk liters: Total fixed expenses / Margin per liter
    const breakEvenMilkLitersMonthly = grossMarginPerLiterMilk > 0 
      ? (laborCost + pastureCost + otherCost) / grossMarginPerLiterMilk
      : 0;

    return {
      totalMilkProducedLiters: Math.round(totalMilkProducedLiters),
      totalMilkRevenue,
      totalCostMilkProduction,
      costPerLiterMilk: Number(costPerLiterMilk.toFixed(3)),
      grossMarginPerLiterMilk: Number(grossMarginPerLiterMilk.toFixed(3)),

      totalBeefProducedKg: Math.round(totalBeefProducedKg),
      totalBeefRevenue,
      totalCostBeefProduction,
      costPerKgGain: Number(costPerKgGain.toFixed(2)),
      grossMarginPerKgBeef: Number(grossMarginPerKgBeef.toFixed(2)),

      totalIncome,
      totalExpense,
      netProfit,
      profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
      breakEvenMilkLitersMonthly: Math.round(breakEvenMilkLitersMonthly)
    };
  }
}
