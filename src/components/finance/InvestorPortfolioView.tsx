import React, { useMemo } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  ShieldCheck, 
  Building2, 
  Award,
  ArrowUpRight,
  Landmark,
  Scale
} from 'lucide-react';
import type { Animal, Farm } from '../../types/animal';
import type { FinancialRecord } from '../../types/finance';
import type { MilkingRecord, WeightRecord } from '../../types/production';

interface InvestorPortfolioViewProps {
  farms: Farm[];
  animals: Animal[];
  financials: FinancialRecord[];
  milkings: MilkingRecord[];
  weights: WeightRecord[];
  selectedFarmId: string;
}

export const InvestorPortfolioView: React.FC<InvestorPortfolioViewProps> = ({
  farms,
  animals,
  financials,
  milkings,
  weights,
  selectedFarmId
}) => {
  const isGlobal = selectedFarmId === 'all';
  const activeFarm = farms.find(f => f.id === selectedFarmId);

  // Filter entities
  const filteredAnimals = useMemo(() => {
    if (isGlobal) return animals;
    return animals.filter(a => a.farmId === selectedFarmId);
  }, [isGlobal, animals, selectedFarmId]);

  const filteredFinancials = useMemo(() => {
    if (isGlobal) return financials;
    return financials.filter(f => f.farmId === selectedFarmId);
  }, [isGlobal, financials, selectedFarmId]);

  // Asset Valuation Model
  // In cattle markets:
  // - Adult Dairy Cow in production: ~$1,200 - $1,500 USD
  // - Adult Bull: ~$2,200 USD
  // - Juvenile/Beef steer: currentWeightKg * $2.20/kg (or $800 default)
  // - Weaned Calf: ~$450 USD
  // - Baby Calf: ~$300 USD
  const assetValuation = useMemo(() => {
    let totalValue = 0;
    let adultCowsValue = 0;
    let bullsValue = 0;
    let juvenilesValue = 0;
    let weanedValue = 0;
    let calvesValue = 0;

    let countCows = 0;
    let countBulls = 0;
    let countJuveniles = 0;
    let countWeaned = 0;
    let countCalves = 0;

    for (const a of filteredAnimals) {
      if (a.status !== 'active') continue;

      let animalVal = 0;
      if (a.currentStage === 'adult') {
        if (a.gender === 'female') {
          animalVal = 1350;
          adultCowsValue += animalVal;
          countCows++;
        } else {
          animalVal = 2400;
          bullsValue += animalVal;
          countBulls++;
        }
      } else if (a.currentStage === 'juvenile') {
        const weight = a.currentWeightKg || 380;
        animalVal = weight * 2.15; // USD/kg en pie
        juvenilesValue += animalVal;
        countJuveniles++;
      } else if (a.currentStage === 'weaned') {
        const weight = a.currentWeightKg || 220;
        animalVal = weight * 2.30;
        weanedValue += animalVal;
        countWeaned++;
      } else {
        animalVal = 320;
        calvesValue += animalVal;
        countCalves++;
      }

      totalValue += animalVal;
    }

    return {
      totalValue,
      adultCowsValue,
      bullsValue,
      juvenilesValue,
      weanedValue,
      calvesValue,
      countCows,
      countBulls,
      countJuveniles,
      countWeaned,
      countCalves,
      totalHead: filteredAnimals.filter(a => a.status === 'active').length
    };
  }, [filteredAnimals]);

  // Financial KPIs
  const financialMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const f of filteredFinancials) {
      if (f.type === 'income') income += f.amount;
      else if (f.type === 'expense') expense += f.amount;
    }

    const netProfit = income - expense;
    const profitMargin = income > 0 ? (netProfit / income) * 100 : 0;

    // Total area
    const totalHectares = isGlobal 
      ? farms.reduce((acc, f) => acc + (f.areaHectares || 0), 0)
      : activeFarm?.areaHectares || 1;

    const profitPerHectare = totalHectares > 0 ? netProfit / totalHectares : 0;
    const assetValuePerHectare = totalHectares > 0 ? assetValuation.totalValue / totalHectares : 0;

    return {
      income,
      expense,
      netProfit,
      profitMargin,
      totalHectares,
      profitPerHectare,
      assetValuePerHectare
    };
  }, [filteredFinancials, isGlobal, farms, activeFarm, assetValuation]);

  const currencySymbol = isGlobal ? '$' : activeFarm?.currency || '$';

  return (
    <div className="space-y-6">
      
      {/* Top Investor Title & Scope */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Tablero Ejecutivo de Inversión y Capital Agropecuario</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isGlobal ? 'Consolidado Patrimonial de Todas las Fincas' : activeFarm?.name || 'Hacienda Ganadera'}
            </h2>
            <p className="text-sm text-indigo-200 leading-relaxed">
              Valoración en tiempo real del inventario semoviente, rentabilidad por hectárea, 
              estructura de costos y capital biológico activo.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-right min-w-[220px]">
            <div className="text-xs uppercase tracking-wider font-bold text-indigo-200">Valoración Total del Hato</div>
            <div className="text-3xl sm:text-4xl font-black text-white mt-1">
              {currencySymbol}{assetValuation.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-emerald-300 font-semibold mt-1 flex items-center justify-end">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              {assetValuation.totalHead} cabezas activas en inventario
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Margen Operativo */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Margen Operativo</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {financialMetrics.profitMargin.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Utilidad neta: {currencySymbol}{financialMetrics.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* KPI 2: Rentabilidad por Hectárea */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Rentabilidad / Ha</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {currencySymbol}{financialMetrics.profitPerHectare.toFixed(1)} <span className="text-sm font-semibold text-gray-500">/ Ha</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Superficie productiva: {financialMetrics.totalHectares} Hectáreas
          </p>
        </div>

        {/* KPI 3: Densidad de Capital Semoviente */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Densidad de Capital</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {currencySymbol}{financialMetrics.assetValuePerHectare.toFixed(0)} <span className="text-sm font-semibold text-gray-500">/ Ha</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Valor de ganado por hectárea
          </p>
        </div>

        {/* KPI 4: Flujo de Ingresos */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Ingresos Totales</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {currencySymbol}{financialMetrics.income.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Costos operativos: {currencySymbol}{financialMetrics.expense.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>

      </div>

      {/* Capital Breakdown by Livestock Category */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center">
          <PieChart className="w-5 h-5 mr-2 text-indigo-600" />
          Composición del Portafolio y Distribución de Capital Biológico
        </h3>

        <div className="space-y-4">
          {/* Cows */}
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
              <span>🐄 Vacas Adultas en Producción ({assetValuation.countCows} cabezas)</span>
              <span>
                {currencySymbol}{assetValuation.adultCowsValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} (
                {assetValuation.totalValue > 0 ? ((assetValuation.adultCowsValue / assetValuation.totalValue) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${assetValuation.totalValue > 0 ? (assetValuation.adultCowsValue / assetValuation.totalValue) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Steers / Juveniles */}
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
              <span>🐂 Novillos de Ceba y Novillas ({assetValuation.countJuveniles} cabezas)</span>
              <span>
                {currencySymbol}{assetValuation.juvenilesValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} (
                {assetValuation.totalValue > 0 ? ((assetValuation.juvenilesValue / assetValuation.totalValue) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${assetValuation.totalValue > 0 ? (assetValuation.juvenilesValue / assetValuation.totalValue) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Weaned */}
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
              <span>🌱 Ganado en Levante / Desteto ({assetValuation.countWeaned} cabezas)</span>
              <span>
                {currencySymbol}{assetValuation.weanedValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} (
                {assetValuation.totalValue > 0 ? ((assetValuation.weanedValue / assetValuation.totalValue) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${assetValuation.totalValue > 0 ? (assetValuation.weanedValue / assetValuation.totalValue) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Bulls */}
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
              <span>👑 Toros Reproductores ({assetValuation.countBulls} cabezas)</span>
              <span>
                {currencySymbol}{assetValuation.bullsValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} (
                {assetValuation.totalValue > 0 ? ((assetValuation.bullsValue / assetValuation.totalValue) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${assetValuation.totalValue > 0 ? (assetValuation.bullsValue / assetValuation.totalValue) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Calves */}
          <div>
            <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
              <span>🍼 Terneros Lactantes ({assetValuation.countCalves} cabezas)</span>
              <span>
                {currencySymbol}{assetValuation.calvesValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} (
                {assetValuation.totalValue > 0 ? ((assetValuation.calvesValue / assetValuation.totalValue) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-rose-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${assetValuation.totalValue > 0 ? (assetValuation.calvesValue / assetValuation.totalValue) * 100 : 0}%` }}
              />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
