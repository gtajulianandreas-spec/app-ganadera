import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Milk, 
  Scale, 
  PieChart as PieIcon, 
  Plus, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import type { FinancialRecord, TransactionCategory } from '../../types/finance';
import type { MilkingRecord, WeightRecord } from '../../types/production';
import { FinancialEngine } from '../../services/financialEngine';
import { db } from '../../db';
import { syncEngine } from '../../sync/engine';

interface FinancialDashboardProps {
  financials: FinancialRecord[];
  milkings: MilkingRecord[];
  weights: WeightRecord[];
  onRefresh: () => void;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  financials,
  milkings,
  weights,
  onRefresh
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txCategory, setTxCategory] = useState<TransactionCategory>('milk_sale');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('500');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const economics = FinancialEngine.calculateUnitEconomics(financials, milkings, weights);

  const chartData = [
    { name: 'Lechería', Ingresos: economics.totalMilkRevenue, Costos: economics.totalCostMilkProduction },
    { name: 'Carne / Ceba', Ingresos: economics.totalBeefRevenue, Costos: economics.totalCostBeefProduction },
    { name: 'Total Operativo', Ingresos: economics.totalIncome, Costos: economics.totalExpense }
  ];

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    const newRecord: FinancialRecord = {
      id: 'fin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      farmId: 'default_farm',
      date,
      type: txType,
      category: txCategory,
      description: description.trim(),
      amount: Number(amount),
      paymentMethod: 'transfer',
      createdAt: Date.now()
    };

    await db.financialRecords.put(newRecord);
    await syncEngine.queueAction('finance', 'create', newRecord.id, newRecord);

    setShowAddModal(false);
    setDescription('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <span>Rentabilidad Real de la Finca</span>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Economía Unitaria Ganadera
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Cálculo automatizado del costo real por litro de leche, costo por kilo de carne y punto de equilibrio
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Registrar Movimiento
        </button>
      </div>

      {/* KPI Unit Economics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Cost per Liter */}
        <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Costo por Litro</span>
            <Milk className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            ${economics.costPerLiterMilk} <span className="text-xs font-semibold text-gray-500">USD/L</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-gray-600 pt-2 border-t border-blue-50">
            <span>Precio venta: $0.58/L</span>
            <span className="font-bold text-emerald-600">Margen: +${economics.grossMarginPerLiterMilk}</span>
          </div>
        </div>

        {/* Cost per Kg Beef Gain */}
        <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Costo por Kg Carne</span>
            <Scale className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            ${economics.costPerKgGain} <span className="text-xs font-semibold text-gray-500">USD/kg</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-gray-600 pt-2 border-t border-amber-50">
            <span>Precio pie: $2.10/kg</span>
            <span className="font-bold text-emerald-600">Margen: +${economics.grossMarginPerKgBeef}</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Utilidad Neta Real</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            ${economics.netProfit.toLocaleString()} <span className="text-xs font-semibold text-gray-500">USD</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-gray-600 pt-2 border-t border-emerald-50">
            <span>Margen neto</span>
            <span className="font-bold text-emerald-700">{economics.profitMarginPercent}%</span>
          </div>
        </div>

        {/* Break-even Point */}
        <div className="bg-white rounded-2xl border border-purple-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Punto de Equilibrio</span>
            <PieIcon className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {economics.breakEvenMilkLitersMonthly.toLocaleString()} <span className="text-xs font-semibold text-gray-500">Litros/mes</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 pt-2 border-t border-purple-50">
            Volumen mínimo para cubrir costos fijos
          </div>
        </div>

      </div>

      {/* Chart Section */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
          <span>Comparativa de Ingresos vs Costos Operacionales</span>
          <span className="text-xs text-gray-400 font-normal">Valores en USD</span>
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()} USD`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Costos" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Libro Diario de Ingresos y Egresos</h2>
          <span className="text-xs text-gray-500 font-medium">{financials.length} movimientos registrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 font-semibold text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {financials.map(rec => (
                <tr key={rec.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-4 font-medium text-gray-700">{rec.date}</td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rec.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {rec.type === 'income' ? 'INGRESO' : 'EGRESO'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-600 capitalize">
                    {rec.category.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-4 text-gray-800 font-medium max-w-sm truncate">
                    {rec.description}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-extrabold ${
                    rec.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {rec.type === 'income' ? '+' : '-'}${rec.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Transaction */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-ranch-600" />
              <span>Registrar Movimiento Financiero</span>
            </h2>

            <form onSubmit={handleSaveTransaction} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tipo</label>
                  <select
                    value={txType}
                    onChange={e => setTxType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-ranch-500"
                  >
                    <option value="income">Ingreso (+)</option>
                    <option value="expense">Egreso (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Categoría</label>
                  <select
                    value={txCategory}
                    onChange={e => setTxCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-ranch-500"
                  >
                    {txType === 'income' ? (
                      <>
                        <option value="milk_sale">Venta de Leche</option>
                        <option value="animal_sale">Venta de Ganado en Pie</option>
                        <option value="breeding_service">Servicio Reproductivo</option>
                        <option value="other">Otros Ingresos</option>
                      </>
                    ) : (
                      <>
                        <option value="feed_supplement">Alimento Concentrado / Sal</option>
                        <option value="veterinary_medicine">Medicamentos / Vacunas</option>
                        <option value="labor_payroll">Nómina y Mano de Obra</option>
                        <option value="pasture_fertilizer">Fertilizantes / Semillas</option>
                        <option value="equipment_fuel">Combustible / Maquinaria</option>
                        <option value="other">Otros Gastos</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Descripción del Concepto</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="ej. Venta quincenal leche o compra de concentrado"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ranch-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Monto (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-ranch-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-ranch-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-ranch-600 hover:bg-ranch-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
