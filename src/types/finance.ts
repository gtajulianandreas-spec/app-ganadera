export type TransactionCategory =
  | 'milk_sale'
  | 'animal_sale'
  | 'breeding_service'
  | 'feed_supplement'
  | 'veterinary_medicine'
  | 'pasture_fertilizer'
  | 'labor_payroll'
  | 'equipment_fuel'
  | 'infrastructure_maintenance'
  | 'other';

export interface FinancialRecord {
  id: string;
  farmId: string;
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  category: TransactionCategory;
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  linkedAnimalId?: string;
  linkedLotId?: string;
  invoiceNumber?: string;
  paymentMethod: 'cash' | 'transfer' | 'credit';
  createdAt: number;
}

export interface UnitEconomicsSummary {
  totalMilkProducedLiters: number;
  totalMilkRevenue: number;
  totalCostMilkProduction: number;
  costPerLiterMilk: number;
  grossMarginPerLiterMilk: number;

  totalBeefProducedKg: number;
  totalBeefRevenue: number;
  totalCostBeefProduction: number;
  costPerKgGain: number;
  grossMarginPerKgBeef: number;

  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMarginPercent: number;
  breakEvenMilkLitersMonthly: number;
}
