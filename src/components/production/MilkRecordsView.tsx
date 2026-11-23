import React, { useState } from 'react';
import { Milk, Plus, Calendar, TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import type { MilkingRecord } from '../../types/production';
import type { Animal } from '../../types/animal';
import { db } from '../../db';
import { syncEngine } from '../../sync/engine';

interface MilkRecordsViewProps {
  milkings: MilkingRecord[];
  animals: Animal[];
  onRefresh: () => void;
}

export const MilkRecordsView: React.FC<MilkRecordsViewProps> = ({
  milkings,
  animals,
  onRefresh
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(animals[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<'AM' | 'PM'>('AM');
  const [liters, setLiters] = useState<string>('14.5');
  const [fat, setFat] = useState<string>('3.8');
  const [calfLiters, setCalfLiters] = useState<string>('2.0');

  const animalMap = new Map(animals.map(a => [a.id, a]));

  // Aggregate milk by date for charts
  const dateMap = new Map<string, number>();
  for (const m of milkings) {
    dateMap.set(m.date, (dateMap.get(m.date) || 0) + m.liters);
  }
  const chartData = Array.from(dateMap.entries())
    .map(([d, l]) => ({ fecha: d.slice(5), litros: Number(l.toFixed(1)) }))
    .slice(-14);

  const totalLiters = milkings.reduce((sum, m) => sum + m.liters, 0);
  const avgPerShift = milkings.length > 0 ? (totalLiters / milkings.length).toFixed(1) : '0';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liters) return;

    const newMilking: MilkingRecord = {
      id: 'milk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      animalId: selectedAnimalId,
      date,
      shift,
      liters: Number(liters),
      fatPercentage: fat ? Number(fat) : undefined,
      calfConsumptionLiters: calfLiters ? Number(calfLiters) : undefined,
      milkerName: 'Carlos M.',
      createdAt: Date.now()
    };

    await db.milkingRecords.put(newMilking);
    await syncEngine.queueAction('milking', 'create', newMilking.id, newMilking);

    setShowAddModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <span>Producción y Control Lechero</span>
            <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              {totalLiters.toFixed(0)} L Totales Registrados
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Registro por turnos (AM/PM), curvas de lactancia y reserva de leche para consumo del ternero
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Registrar Ordeño
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
          <span>Curva de Producción Diaria (Últimas 2 Semanas)</span>
          <span className="text-xs text-blue-600 font-bold">Promedio: {avgPerShift} L/ordeño</span>
        </h2>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="milkColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="fecha" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(val: any) => [`${val} Litros`, 'Producción']}
              />
              <Area type="monotone" dataKey="litros" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#milkColor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Historial Reciente de Ordeños</h2>
          <span className="text-xs text-gray-500 font-medium">{milkings.length} pesajes de leche</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 font-semibold text-gray-500 uppercase">
              <tr>
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Animal</th>
                <th className="py-2.5 px-4">Turno</th>
                <th className="py-2.5 px-4 text-right">Litros</th>
                <th className="py-2.5 px-4 text-right">Grasa %</th>
                <th className="py-2.5 px-4 text-right">Consumo Ternero</th>
                <th className="py-2.5 px-4">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {milkings.slice(0, 15).map(m => {
                const a = animalMap.get(m.animalId);
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-medium text-gray-700">{m.date}</td>
                    <td className="py-2.5 px-4 font-bold text-gray-900">
                      {a?.earTagCode} <span className="font-normal text-gray-500 text-[11px]">({a?.name || 'Vaca'})</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                        {m.shift}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-blue-600">{m.liters.toFixed(1)} L</td>
                    <td className="py-2.5 px-4 text-right text-gray-600">{m.fatPercentage ? `${m.fatPercentage}%` : '—'}</td>
                    <td className="py-2.5 px-4 text-right text-gray-500">{m.calfConsumptionLiters ? `${m.calfConsumptionLiters} L` : '0 L'}</td>
                    <td className="py-2.5 px-4 text-gray-500">{m.milkerName || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal New Milking */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Milk className="w-5 h-5 text-blue-600" />
              <span>Registrar Ordeño</span>
            </h2>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Vaca en Ordeño</label>
                <select
                  value={selectedAnimalId}
                  onChange={e => setSelectedAnimalId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-ranch-500"
                >
                  {animals.filter(a => a.purpose === 'milk' || a.gender === 'female').map(a => (
                    <option key={a.id} value={a.id}>
                      {a.earTagCode} - {a.name || 'Sin nombre'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-ranch-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Turno</label>
                  <select
                    value={shift}
                    onChange={e => setShift(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-ranch-500"
                  >
                    <option value="AM">Mañana (AM)</option>
                    <option value="PM">Tarde (PM)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Litros</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={liters}
                    onChange={e => setLiters(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-ranch-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Grasa %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fat}
                    onChange={e => setFat(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-ranch-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ternero (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calfLiters}
                    onChange={e => setCalfLiters(e.target.value)}
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
                  Guardar Ordeño
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
