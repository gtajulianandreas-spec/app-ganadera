import React, { useState, useMemo } from 'react';
import { Scale, Plus, Bluetooth, Check, TrendingUp } from 'lucide-react';
import type { WeightRecord } from '../../types/production';
import type { Animal } from '../../types/animal';
import { db } from '../../db';
import { saveEntityWithOutbox } from '../../db/mutations';
import { generateId } from '../../utils/id';

interface WeightRecordsViewProps {
  weights: WeightRecord[];
  animals: Animal[];
  onRefresh: () => void;
}

export const WeightRecordsView: React.FC<WeightRecordsViewProps> = ({
  weights,
  animals,
  onRefresh
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(animals[0]?.id || '');
  const [weightKg, setWeightKg] = useState<string>('420');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isBluetoothReading, setIsBluetoothReading] = useState(false);

  const animalMap = useMemo(() => new Map(animals.map(a => [a.id, a])), [animals]);

  const handleSimulateBluetoothScale = () => {
    setIsBluetoothReading(true);
    setTimeout(() => {
      // Simulate stable weight read from Tru-Test / Allflex scale
      const randomWeight = Math.round(410 + Math.random() * 40);
      setWeightKg(String(randomWeight));
      setIsBluetoothReading(false);
    }, 1200);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg) return;

    // Calculate ADG compared to previous weight
    const previousWeights = await db.weightRecords
      .where('animalId')
      .equals(selectedAnimalId)
      .reverse()
      .sortBy('date');

    let averageDailyGainKg: number | undefined;
    if (previousWeights.length > 0) {
      const prev = previousWeights[0];
      const prevDate = new Date(prev.date);
      const currDate = new Date(date);
      const days = Math.max(1, Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)));
      const gain = Number(weightKg) - prev.weightKg;
      averageDailyGainKg = Number((gain / days).toFixed(2));
    }

    const selectedAnimal = animalMap.get(selectedAnimalId);

    const newWeight: WeightRecord = {
      id: generateId('wt'),
      farmId: selectedAnimal?.farmId,
      animalId: selectedAnimalId,
      date,
      weightKg: Number(weightKg),
      averageDailyGainKg,
      source: 'bluetooth_scale',
      createdAt: Date.now()
    };

    await saveEntityWithOutbox(db.weightRecords, 'weight', 'create', newWeight);
    // Update animal's current weight
    await db.animals.update(selectedAnimalId, { currentWeightKg: Number(weightKg) });

    setShowAddModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <span>Pesaje y Control de Ceba</span>
            <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
              Ganancia Diaria (GDP)
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Conexión con básculas ganaderas Bluetooth para captura instantánea de peso y cálculo de ganancia diaria
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Registrar Pesaje
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Historial de Pesajes y Ganancia Diaria (ADG)</h2>
          <span className="text-xs text-gray-500 font-medium">{weights.length} pesajes registrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 font-semibold text-gray-500 uppercase">
              <tr>
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Animal / Arete</th>
                <th className="py-2.5 px-4 text-right">Peso Registrado</th>
                <th className="py-2.5 px-4 text-right">Ganancia Diaria (GDP)</th>
                <th className="py-2.5 px-4">Fuente / Báscula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {weights.map(w => {
                const a = animalMap.get(w.animalId);
                return (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-medium text-gray-700">{w.date}</td>
                    <td className="py-2.5 px-4 font-bold text-gray-900">
                      {a?.earTagCode} <span className="font-normal text-gray-500 text-[11px]">({a?.name || 'Animal'})</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-gray-900 text-sm">
                      {w.weightKg} kg
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {w.averageDailyGainKg !== undefined ? (
                        <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded text-xs ${
                          w.averageDailyGainKg >= 1.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +{w.averageDailyGainKg} kg/día
                        </span>
                      ) : (
                        <span className="text-gray-400">Primer pesaje</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500">
                      <span className="inline-flex items-center text-xs">
                        <Bluetooth className="w-3.5 h-3.5 mr-1 text-blue-500" />
                        Báscula Bluetooth
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Weight */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Scale className="w-5 h-5 text-amber-600" />
              <span>Registrar Pesaje de Corral</span>
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Seleccionar Animal</label>
                <select
                  value={selectedAnimalId}
                  onChange={e => setSelectedAnimalId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-ranch-500"
                >
                  {animals.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.earTagCode} - {a.name || 'Sin nombre'} (Actual: {a.currentWeightKg || '—'} kg)
                    </option>
                  ))}
                </select>
              </div>

              {/* Bluetooth Scale Capture Bar */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bluetooth className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-900 text-xs">Báscula Digital Bluetooth</span>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateBluetoothScale}
                  disabled={isBluetoothReading}
                  className="px-3 py-1.5 rounded-lg font-bold text-[11px] bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                >
                  {isBluetoothReading ? 'Leyendo...' : 'Capturar Peso'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Peso (Kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-black text-lg text-gray-900 focus:ring-2 focus:ring-ranch-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha de Pesaje</label>
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
                  Guardar Pesaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
