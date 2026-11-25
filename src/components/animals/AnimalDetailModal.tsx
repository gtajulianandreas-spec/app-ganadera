import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Tag, 
  Scale, 
  Milk, 
  GitBranch, 
  HeartPulse, 
  Calendar, 
  Clock, 
  Award, 
  Plus,
  AlertCircle,
  Camera,
  Upload,
  Building2
} from 'lucide-react';
import type { Animal, Lot } from '../../types/animal';
import type { MilkingRecord, WeightRecord, HealthRecord } from '../../types/production';
import type { ReproductionEvent } from '../../types/reproduction';
import { db } from '../../db';
import { VisualSearchService } from '../../services/visualSearchService';
import { syncEngine } from '../../sync/engine';

interface AnimalDetailModalProps {
  animal: Animal;
  lot?: Lot;
  onClose: () => void;
  onRefresh?: () => void;
}

export const AnimalDetailModal: React.FC<AnimalDetailModalProps> = ({
  animal,
  lot,
  onClose,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'milk' | 'weights' | 'reproduction' | 'health'>('overview');
  const [currentPhoto, setCurrentPhoto] = useState<string | undefined>(animal.photoUrl);
  const [milkRecords, setMilkRecords] = useState<MilkingRecord[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [reproEvents, setReproEvents] = useState<ReproductionEvent[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdatePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await VisualSearchService.compressImage(file);
      const photoFeatures = await VisualSearchService.extractFeatures(compressed);
      const now = Date.now();
      const nextVersion = (animal.version || 1) + 1;
      await db.animals.update(animal.id, {
        photoUrl: compressed,
        photoFeatures,
        updatedAt: now,
        version: nextVersion
      });
      await syncEngine.queueAction('animal', 'update', animal.id, {
        ...animal,
        photoUrl: compressed,
        photoFeatures,
        updatedAt: now,
        version: nextVersion
      });
      setCurrentPhoto(compressed);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error updating animal photo:', err);
    }
  };

  useEffect(() => {
    setCurrentPhoto(animal.photoUrl);
  }, [animal.photoUrl]);

  useEffect(() => {
    async function loadAnimalData() {
      const [m, w, r, h] = await Promise.all([
        db.milkingRecords.where('animalId').equals(animal.id).reverse().toArray(),
        db.weightRecords.where('animalId').equals(animal.id).reverse().toArray(),
        db.reproductionEvents.where('animalId').equals(animal.id).reverse().toArray(),
        db.healthRecords.where('animalId').equals(animal.id).reverse().toArray()
      ]);
      setMilkRecords(m);
      setWeightRecords(w);
      setReproEvents(r);
      setHealthRecords(h);
    }
    loadAnimalData();
  }, [animal.id]);

  // Calculations
  const totalLiters = milkRecords.reduce((sum, r) => sum + r.liters, 0);
  const avgMilk = milkRecords.length > 0 ? (totalLiters / milkRecords.length).toFixed(1) : '0';
  const latestWeight = weightRecords[0]?.weightKg || animal.currentWeightKg || '—';
  const latestAdg = weightRecords[0]?.averageDailyGainKg?.toFixed(2) || '—';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-ranch-700 to-ranch-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-bold border border-white/20 overflow-hidden shrink-0 shadow-sm bg-gray-900/40">
                {currentPhoto ? (
                  <img src={currentPhoto} alt={animal.earTagCode} className="w-full h-full object-cover" />
                ) : (
                  <span>🐄</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1 bg-white text-ranch-800 rounded-full shadow-md hover:bg-gray-100 transition-transform scale-90 hover:scale-100"
                title="Actualizar fotografía"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold tracking-tight">
                  {animal.name || `Animal ${animal.earTagCode}`}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-white/20 text-white">
                  {animal.earTagCode}
                </span>
              </div>
              <p className="text-xs text-ranch-200 mt-0.5">
                {animal.breedComposition.map(b => `${b.percentage}% ${b.breedName}`).join(' × ') || 'Mestizo'} • {animal.species.toUpperCase()}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stat Pill Bar */}
        <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50/70 p-3 text-center text-xs">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Peso Actual</span>
            <span className="font-extrabold text-gray-800 text-sm">{latestWeight} kg</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Promedio Leche</span>
            <span className="font-extrabold text-blue-600 text-sm">{avgMilk} L/ordeño</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Ganancia GDP</span>
            <span className="font-extrabold text-emerald-600 text-sm">{latestAdg} kg/día</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Lote Asignado</span>
            <span className="font-semibold text-gray-700 text-xs truncate block">{lot?.name || 'Sin lote'}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 space-x-6 text-xs font-bold uppercase tracking-wider text-gray-500 overflow-x-auto">
          {[
            { id: 'overview', label: 'Ficha General', icon: Tag },
            { id: 'milk', label: `Lechería (${milkRecords.length})`, icon: Milk },
            { id: 'weights', label: `Pesajes (${weightRecords.length})`, icon: Scale },
            { id: 'reproduction', label: `Reproducción (${reproEvents.length})`, icon: GitBranch },
            { id: 'health', label: `Sanidad (${healthRecords.length})`, icon: HeartPulse }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-3.5 flex items-center space-x-1.5 border-b-2 transition-all ${
                  isActive
                    ? 'border-ranch-600 text-ranch-700 font-extrabold'
                    : 'border-transparent hover:text-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          
          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Photo & Visual Profile Card */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-28 h-28 rounded-xl overflow-hidden border border-gray-300 bg-white shadow-xs shrink-0">
                  {currentPhoto ? (
                    <img src={currentPhoto} alt={animal.earTagCode} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 font-bold text-xs">
                      <Camera className="w-6 h-6 mb-1 text-gray-300" />
                      <span>Sin Foto</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5 text-center sm:text-left">
                  <span className="font-bold text-xs text-gray-900 block">Fotografía y Perfil Visual del Animal</span>
                  <p className="text-[11px] text-gray-500">
                    Utilizada por el motor de búsqueda visual para identificar el animal automáticamente en brete o potrero mediante cámara.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 shadow-2xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                    {currentPhoto ? 'Cambiar Fotografía' : 'Subir Fotografía'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleUpdatePhoto}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <span className="text-gray-400 text-xs block font-medium">Arete Oficial</span>
                  <span className="text-sm font-bold text-gray-900">{animal.earTagCode}</span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <span className="text-gray-400 text-xs block font-medium">Chip RFID / NFC</span>
                  <span className="text-sm font-mono font-medium text-gray-800 truncate block">
                    {animal.electronicId || 'No asignado'}
                  </span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <span className="text-gray-400 text-xs block font-medium">Fecha Nacimiento</span>
                  <span className="text-sm font-semibold text-gray-900">{animal.birthDate}</span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <span className="text-gray-400 text-xs block font-medium">Sexo y Etapa</span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">
                    {animal.gender === 'female' ? 'Hembra' : 'Macho'} • {animal.currentStage}
                  </span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <span className="text-gray-400 text-xs block font-medium">Propósito Zootécnico</span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{animal.purpose}</span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <span className="text-gray-400 text-xs block font-medium">Estado del Animal</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {animal.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {animal.notes && (
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60 text-xs text-amber-900">
                  <span className="font-bold block mb-1">Notas de Campo:</span>
                  {animal.notes}
                </div>
              )}
            </div>
          )}

          {/* 2. MILK RECORDS */}
          {activeTab === 'milk' && (
            <div className="space-y-3">
              {milkRecords.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-xs font-medium">
                  No hay registros de ordeño para este animal.
                </p>
              ) : (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Turno</th>
                        <th className="py-2.5 px-3 text-right">Litros</th>
                        <th className="py-2.5 px-3 text-right">Grasa %</th>
                        <th className="py-2.5 px-3 text-right">Consumo Ternero</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {milkRecords.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-900">{r.date}</td>
                          <td className="py-2 px-3"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-bold">{r.shift}</span></td>
                          <td className="py-2 px-3 text-right font-bold text-blue-600">{r.liters.toFixed(1)} L</td>
                          <td className="py-2 px-3 text-right text-gray-600">{r.fatPercentage ? `${r.fatPercentage}%` : '—'}</td>
                          <td className="py-2 px-3 text-right text-gray-500">{r.calfConsumptionLiters ? `${r.calfConsumptionLiters} L` : '0 L'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. WEIGHTS */}
          {activeTab === 'weights' && (
            <div className="space-y-3">
              {weightRecords.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-xs font-medium">
                  No hay registros de pesaje para este animal.
                </p>
              ) : (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3 text-right">Peso (Kg)</th>
                        <th className="py-2.5 px-3 text-right">Ganancia GDP (Kg/día)</th>
                        <th className="py-2.5 px-3">Origen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {weightRecords.map(w => (
                        <tr key={w.id} className="hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-900">{w.date}</td>
                          <td className="py-2 px-3 text-right font-bold text-gray-800">{w.weightKg} kg</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-600">{w.averageDailyGainKg ? `+${w.averageDailyGainKg} kg/d` : '—'}</td>
                          <td className="py-2 px-3 text-gray-500 capitalize">{w.source === 'bluetooth_scale' ? 'Báscula Bluetooth' : 'Manual'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. REPRODUCTION */}
          {activeTab === 'reproduction' && (
            <div className="space-y-3">
              {reproEvents.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-xs font-medium">
                  No hay eventos reproductivos registrados.
                </p>
              ) : (
                <div className="space-y-2">
                  {reproEvents.map(r => (
                    <div key={r.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-start justify-between text-xs">
                      <div>
                        <div className="font-bold text-gray-900 capitalize flex items-center space-x-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-ranch-600" />
                          <span>{r.eventType.replace('_', ' ')}</span>
                          {r.pregnancyResult && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              {r.pregnancyResult.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 mt-1">
                          Fecha: <span className="font-semibold text-gray-700">{r.date}</span>
                          {r.sireId && ` • Toro/Pajilla: ${r.sireId}`}
                          {r.technicianName && ` • Inseminador: ${r.technicianName}`}
                        </p>
                        {r.notes && <p className="text-gray-600 mt-1 italic text-[11px]">{r.notes}</p>}
                      </div>

                      {r.projectedCalvingDate && (
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Parto Estimado</span>
                          <span className="font-bold text-ranch-700">{r.projectedCalvingDate}</span>
                          {r.mandatoryDryOffDate && (
                            <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                              Secar: {r.mandatoryDryOffDate}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. HEALTH */}
          {activeTab === 'health' && (
            <div className="space-y-3">
              {healthRecords.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-xs font-medium">
                  No hay tratamientos veterinarios registrados.
                </p>
              ) : (
                <div className="space-y-2">
                  {healthRecords.map(h => (
                    <div key={h.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs flex items-start justify-between">
                      <div>
                        <div className="font-bold text-gray-900 capitalize flex items-center space-x-1.5">
                          <HeartPulse className="w-3.5 h-3.5 text-red-500" />
                          <span>{h.treatmentName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-700">
                            {h.type}
                          </span>
                        </div>
                        <p className="text-gray-500 mt-1">
                          Fecha: {h.date} • Dosis: {h.doseMl ? `${h.doseMl} ml` : 'N/A'} • Vía: {h.administrationRoute || 'N/A'}
                        </p>
                        {h.veterinarianName && <p className="text-gray-500">Vet: {h.veterinarianName}</p>}
                      </div>

                      {h.safeMilkDate && (
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-amber-600 block">Retiro Leche Hasta</span>
                          <span className="font-bold text-amber-800">{h.safeMilkDate}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>
    </div>
  );
};
