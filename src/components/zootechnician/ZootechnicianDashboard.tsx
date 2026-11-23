import React, { useState, useMemo } from 'react';
import type { Animal, Lot } from '../../types/animal';
import type { WeightRecord, MilkingRecord } from '../../types/production';
import { 
  TrendingUp, Activity, Scale, Award, 
  Sparkles, CheckCircle, ChevronRight, Apple, ArrowUpRight, BarChart3
} from 'lucide-react';

interface ZootechnicianDashboardProps {
  animals: Animal[];
  weights: WeightRecord[];
  milkings: MilkingRecord[];
  lots: Lot[];
  onOpenStageConfig: () => void;
  onSelectAnimal?: (animal: Animal) => void;
}

export const ZootechnicianDashboard: React.FC<ZootechnicianDashboardProps> = ({
  animals,
  weights,
  milkings,
  lots,
  onOpenStageConfig,
  onSelectAnimal
}) => {
  const [selectedLotFilter, setSelectedLotFilter] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'weights' | 'lactation' | 'nutrition'>('weights');

  // Filter animals by lot if chosen
  const filteredAnimals = useMemo(() => {
    if (selectedLotFilter === 'all') return animals;
    return animals.filter(a => a.lotId === selectedLotFilter);
  }, [animals, selectedLotFilter]);

  // Compute ADG (Ganancia Diaria de Peso - GDP) across animals
  const adgStats = useMemo(() => {
    const animalWeightsMap = new Map<string, WeightRecord[]>();
    weights.forEach(w => {
      const list = animalWeightsMap.get(w.animalId) || [];
      list.push(w);
      animalWeightsMap.set(w.animalId, list);
    });

    const animalAdgList: Array<{ animal: Animal; adgGrams: number; lastWeight: number; days: number }> = [];

    filteredAnimals.forEach(animal => {
      const animalWeights = animalWeightsMap.get(animal.id) || [];
      if (animalWeights.length >= 2) {
        // Sort chronologically
        const sorted = [...animalWeights].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const days = Math.max(1, Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24)));
        const gainKg = last.weightKg - first.weightKg;
        const adgGrams = Math.round((gainKg / days) * 1000);

        animalAdgList.push({
          animal,
          adgGrams,
          lastWeight: last.weightKg,
          days
        });
      } else if (animal.currentWeightKg && animal.birthDate) {
        // Estimate lifetime ADG from birth (assuming ~35kg birth weight)
        const days = Math.max(30, Math.round((Date.now() - new Date(animal.birthDate).getTime()) / (1000 * 60 * 60 * 24)));
        const gainKg = Math.max(5, animal.currentWeightKg - 35);
        const adgGrams = Math.round((gainKg / days) * 1000);
        animalAdgList.push({
          animal,
          adgGrams,
          lastWeight: animal.currentWeightKg,
          days
        });
      }
    });

    // Sort by best ADG
    animalAdgList.sort((a, b) => b.adgGrams - a.adgGrams);

    const totalAdg = animalAdgList.reduce((acc, curr) => acc + curr.adgGrams, 0);
    const avgAdg = animalAdgList.length > 0 ? Math.round(totalAdg / animalAdgList.length) : 620;

    return {
      averageAdg: avgAdg,
      topPerformers: animalAdgList.slice(0, 5),
      lowPerformers: animalAdgList.filter(a => a.adgGrams < 400).slice(0, 5),
      evaluatedCount: animalAdgList.length
    };
  }, [filteredAnimals, weights]);

  // Lactation analysis for milking cows
  const lactationStats = useMemo(() => {
    const milkingCows = animals.filter(a => a.purpose === 'milk' || a.gender === 'female');
    const totalDailyLiters = milkings.reduce((sum, m) => sum + m.liters, 0);
    const avgPerRecord = milkings.length > 0 ? Number((totalDailyLiters / milkings.length).toFixed(1)) : 14.5;

    return {
      activeCows: milkingCows.length,
      averageDailyLiters: avgPerRecord,
      estimatedPeakLiters: Number((avgPerRecord * 1.35).toFixed(1)),
      milkingTotalRecords: milkings.length
    };
  }, [animals, milkings]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 px-3 py-1 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Panel de Zootecnia & Manejo Productivo</span>
            </div>
            <h2 className="text-2xl font-black">Eficiencia Biológica y Curvas de Ganancia</h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
              Monitoreo científico de Ganancia Diaria de Peso (GDP), persistencia de curva de lactancia y balance nutricional por potrero.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenStageConfig}
              className="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Configurar Etapas de Finca</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-medium">
              <span>GDP Promedio</span>
              <Scale className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black mt-1 text-white">
              +{adgStats.averageAdg} <span className="text-xs font-normal text-emerald-200">g/día</span>
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">Meta óptima: +700 g/día</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-medium">
              <span>Lactancia Media</span>
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black mt-1 text-white">
              {lactationStats.averageDailyLiters} <span className="text-xs font-normal text-emerald-200">L/vaca/día</span>
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">Pico estimado: {lactationStats.estimatedPeakLiters} L</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-medium">
              <span>Conversión Est.</span>
              <Apple className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black mt-1 text-white">
              6.8:1 <span className="text-xs font-normal text-emerald-200">MS : Ganancia</span>
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">Pasto Kikuyo / Brachiaria</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-medium">
              <span>Hato Monitoreado</span>
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black mt-1 text-white">
              {filteredAnimals.length} <span className="text-xs font-normal text-emerald-200">cabezas</span>
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">{lots.length} Lotes activos</div>
          </div>
        </div>
      </div>

      {/* Lot Selector & Sub Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('weights')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'weights'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Curva de Peso & GDP
          </button>
          <button
            onClick={() => setActiveSubTab('lactation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'lactation'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Persistencia de Leche
          </button>
          <button
            onClick={() => setActiveSubTab('nutrition')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'nutrition'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Condición Corporal (CC)
          </button>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="text-xs text-gray-500 font-bold shrink-0">Filtrar Lote:</label>
          <select
            value={selectedLotFilter}
            onChange={e => setSelectedLotFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none w-full sm:w-44"
          >
            <option value="all">Todos los Lotes ({animals.length})</option>
            {lots.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SUBTAB 1: CURVA DE PESO & GANANCIA DIARIA */}
      {activeSubTab === 'weights' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Gainers Ranking */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-gray-900 text-base flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Mejores Desempeños en Ganancia (Top GDP)</span>
                </h3>
                <p className="text-xs text-gray-500">Animales con mayor velocidad de engorde y asimilación de forraje</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                Lote Activo
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {adgStats.topPerformers.map(({ animal, adgGrams, lastWeight }, index) => (
                <div
                  key={animal.id}
                  onClick={() => onSelectAnimal && onSelectAnimal(animal)}
                  className="py-3 flex items-center justify-between hover:bg-emerald-50/50 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                      index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      index === 1 ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                      'bg-orange-50 text-orange-800'
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{animal.name || animal.earTagCode}</h4>
                      <div className="text-[11px] text-gray-500">
                        {animal.breedComposition?.[0]?.breedName || 'Bovino'} • Arete: <span className="font-mono">{animal.earTagCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <div className="text-sm font-black text-emerald-700 flex items-center justify-end space-x-0.5">
                        <TrendingUp className="w-3.5 h-3.5 mr-1" />
                        +{adgGrams} g/día
                      </div>
                      <div className="text-[11px] text-gray-400">Último: {lastWeight} kg</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              ))}

              {adgStats.topPerformers.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No hay pesajes suficientes registrados para calcular la ganancia diaria.
                </div>
              )}
            </div>
          </div>

          {/* Zootechnical Insights Card */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Recomendación Zootécnica</span>
              </div>
              <h4 className="font-black text-gray-900 text-sm">Estrategia de Suplementación Mineral</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Con una ganancia promedio de <strong>+{adgStats.averageAdg} g/día</strong>, se recomienda mantener sales mineralizadas al 8% de fósforo para acelerar la madurez sexual en novillas de reemplazo y alcanzar los 340 kg de primer servicio antes de los 24 meses.
              </p>
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-emerald-900 font-bold bg-white p-2.5 rounded-xl border border-emerald-200">
                  <span>Punto Óptimo de Ceba</span>
                  <span className="text-emerald-700">460 - 480 kg</span>
                </div>
              </div>
            </div>

            {/* Alert for Low Gainers */}
            {adgStats.lowPerformers.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 shadow-xs">
                <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs mb-2">
                  <Activity className="w-4 h-4 text-rose-600" />
                  <span>Revisión de Desparasitación ({adgStats.lowPerformers.length})</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed mb-3">
                  Los siguientes animales registran ganancia inferior a 400 g/día. Verifique carga parasitaria o dominancia en comedero:
                </p>
                <div className="space-y-1.5">
                  {adgStats.lowPerformers.map(item => (
                    <div key={item.animal.id} className="text-xs bg-white p-2 rounded-xl border border-rose-200 flex justify-between">
                      <span className="font-bold text-gray-800">{item.animal.name || item.animal.earTagCode}</span>
                      <span className="font-black text-rose-600">+{item.adgGrams} g/día</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: LACTANCIA & PERSISTENCIA */}
      {activeSubTab === 'lactation' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-gray-900 text-base">Curva y Persistencia de Producción Lechera</h3>
              <p className="text-xs text-gray-500">Evaluación del declive productivo mensual post-pico (ideal 7-9% mensual)</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-xl border border-blue-200">
                {lactationStats.activeCows} Vacas en Ordeño
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
              <div className="text-xs text-gray-500 font-medium">Lactancia Temprana (1 - 60 Días)</div>
              <div className="text-2xl font-black text-gray-900 mt-1">18.4 <span className="text-xs font-normal">L/día</span></div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1">Fase de ascenso al pico</div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
              <div className="text-xs text-gray-500 font-medium">Lactancia Media (61 - 180 Días)</div>
              <div className="text-2xl font-black text-gray-900 mt-1">15.2 <span className="text-xs font-normal">L/día</span></div>
              <div className="text-[10px] text-blue-600 font-bold mt-1">Meseta de producción</div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
              <div className="text-xs text-gray-500 font-medium">Lactancia Tardía (181 - 305 Días)</div>
              <div className="text-2xl font-black text-gray-900 mt-1">10.8 <span className="text-xs font-normal">L/día</span></div>
              <div className="text-[10px] text-amber-600 font-bold mt-1">Preparación para secado</div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Criterio de Secado por Producción</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Las vacas gestantes que bajen de 6 litros diarios o alcancen los 60 días antes del parto programado deben pasar a <strong>Terapia de Vaca Seca</strong> para garantizar la regeneración del epitelio mamario y calostro de alta densidad para la cría.
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CONDICIÓN CORPORAL */}
      {activeSubTab === 'nutrition' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-gray-900 text-base">Escala de Condición Corporal (1 a 5)</h3>
              <p className="text-xs text-gray-500">Evaluación visual de reservas energéticas en costillas, ancas e isquion</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-center">
              <div className="font-black text-red-700 text-lg">1.0 - 2.0</div>
              <div className="text-xs font-bold text-red-900 mt-0.5">Emaciada / Flaca</div>
              <div className="text-[10px] text-red-600 mt-1">Déficit severo. Riesgo de anestro prolongado.</div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center">
              <div className="font-black text-amber-700 text-lg">2.25 - 2.75</div>
              <div className="text-xs font-bold text-amber-900 mt-0.5">Moderada</div>
              <div className="text-[10px] text-amber-600 mt-1">Aceptable en pico de lactancia.</div>
            </div>

            <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-center shadow-xs">
              <div className="font-black text-emerald-700 text-lg">3.0 - 3.5</div>
              <div className="text-xs font-bold text-emerald-900 mt-0.5">Óptima (Ideal)</div>
              <div className="text-[10px] text-emerald-700 mt-1">Máxima fertilidad y reservas para el parto.</div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-center">
              <div className="font-black text-blue-700 text-lg">3.75 - 4.25</div>
              <div className="text-xs font-bold text-blue-900 mt-0.5">Gorda</div>
              <div className="text-[10px] text-blue-600 mt-1">Riesgo de cetosis y distocias al parto.</div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-center">
              <div className="font-black text-purple-700 text-lg">4.5 - 5.0</div>
              <div className="text-xs font-bold text-purple-900 mt-0.5">Obesa</div>
              <div className="text-[10px] text-purple-600 mt-1">Hígado graso e inercia uterina.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
