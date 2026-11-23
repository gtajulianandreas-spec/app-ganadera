import React, { useState, useMemo } from 'react';
import { 
  X, 
  Settings2, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  Save, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import type { Animal, Farm, StageTransitionConfig } from '../../types/animal';
import { 
  StageTransitionEngine, 
  DEFAULT_STAGE_CONFIG, 
  type StageTransitionCandidate 
} from '../../services/stageTransitionEngine';
import { db } from '../../db';
import { syncEngine } from '../../sync/engine';

interface StageTransitionModalProps {
  farm: Farm;
  animals: Animal[];
  onClose: () => void;
  onUpdated: () => void;
}

export const StageTransitionModal: React.FC<StageTransitionModalProps> = ({
  farm,
  animals,
  onClose,
  onUpdated
}) => {
  const initialConfig: StageTransitionConfig = farm.stageConfig || DEFAULT_STAGE_CONFIG;

  const [calfMax, setCalfMax] = useState<number>(initialConfig.calfMaxMonths);
  const [weanedMax, setWeanedMax] = useState<number>(initialConfig.weanedMaxMonths);
  const [juvenileMax, setJuvenileMax] = useState<number>(initialConfig.juvenileMaxMonths);
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeConfig: StageTransitionConfig = useMemo(() => ({
    calfMaxMonths: Number(calfMax) || 7,
    weanedMaxMonths: Number(weanedMax) || 14,
    juvenileMaxMonths: Number(juvenileMax) || 24
  }), [calfMax, weanedMax, juvenileMax]);

  // Candidates for transition with current rules
  const candidates: StageTransitionCandidate[] = useMemo(() => {
    return StageTransitionEngine.findTransitionCandidates(animals, activeConfig);
  }, [animals, activeConfig]);

  // Distribution summary
  const stageStats = useMemo(() => {
    let calves = 0;
    let weaned = 0;
    let juveniles = 0;
    let adults = 0;

    for (const a of animals) {
      if (a.status !== 'active') continue;
      const { months } = StageTransitionEngine.calculateAge(a.birthDate);
      const stage = StageTransitionEngine.getRecommendedStage(months, activeConfig);
      if (stage === 'calf') calves++;
      else if (stage === 'weaned') weaned++;
      else if (stage === 'juvenile') juveniles++;
      else if (stage === 'adult') adults++;
    }

    return { calves, weaned, juveniles, adults, total: animals.length };
  }, [animals, activeConfig]);

  const handleSaveConfig = async () => {
    try {
      const updatedFarm: Farm = {
        ...farm,
        stageConfig: activeConfig,
        updatedAt: Date.now()
      };
      await db.farms.put(updatedFarm);
      await syncEngine.queueAction('farm', 'update', updatedFarm.id, updatedFarm);
      setSuccessMessage('¡Configuración de etapas guardada con éxito para esta finca!');
      setTimeout(() => setSuccessMessage(null), 3500);
      onUpdated();
    } catch (err) {
      console.error('Error saving stage config:', err);
    }
  };

  const handleApplyTransitions = async () => {
    if (candidates.length === 0) return;
    setIsApplying(true);
    try {
      // 1. Save config first
      const updatedFarm: Farm = {
        ...farm,
        stageConfig: activeConfig,
        updatedAt: Date.now()
      };
      await db.farms.put(updatedFarm);
      await syncEngine.queueAction('farm', 'update', updatedFarm.id, updatedFarm);

      // 2. Transition animals
      const count = await StageTransitionEngine.applyTransitions(candidates);
      setSuccessMessage(`¡Se han reclasificado y actualizado con éxito ${count} animales a su etapa correspondiente!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onUpdated();
      }, 1800);
    } catch (err) {
      console.error('Error applying transitions:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-ranch-800 text-white px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Configuración de Etapas de Crecimiento</h3>
              <p className="text-xs text-emerald-200">
                Finca: <span className="font-semibold text-white">{farm.name}</span> • Adaptada a su manejo zootécnico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-emerald-100 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-sm text-gray-700">
          
          {/* Explanation Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
              <span className="font-bold">Personalización por Finca y Raza:</span> Cada ganadería maneja diferentes
              tiempos de destete y ceba (e.g. razas cebú vs europeas). Define los meses límite y el sistema
              recomendará y reclasificará automáticamente los animales según su fecha de nacimiento real.
            </div>
          </div>

          {/* Configuration Form */}
          <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200 space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 mr-1.5 text-gray-600" />
              Límites de Edad por Etapa (en meses)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Calf */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  🍼 Ternero / Lactante
                </label>
                <div className="text-[11px] text-gray-500 mb-2">Desde nacimiento hasta:</div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="3"
                    max="12"
                    value={calfMax}
                    onChange={e => setCalfMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-gray-500">meses</span>
                </div>
              </div>

              {/* Weaned / Levante */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  🌱 Levante / Desteto
                </label>
                <div className="text-[11px] text-gray-500 mb-2">Destetado hasta:</div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={calfMax + 1}
                    max="20"
                    value={weanedMax}
                    onChange={e => setWeanedMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-gray-500">meses</span>
                </div>
              </div>

              {/* Juvenile / Ceba */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  🐂 Novillo / Ceba
                </label>
                <div className="text-[11px] text-gray-500 mb-2">Crecimiento hasta:</div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={weanedMax + 1}
                    max="36"
                    value={juvenileMax}
                    onChange={e => setJuvenileMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-gray-500">meses</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 italic flex items-center">
              <HelpCircle className="w-3.5 h-3.5 mr-1 text-gray-400" />
              Todo animal mayor a {juvenileMax} meses se clasifica automáticamente como Adulto (Vaca en producción o Toro).
            </div>
          </div>

          {/* Dynamic Distribution Bar */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Proyección de Inventario según estos límites:
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                <div className="text-lg font-bold text-amber-800">{stageStats.calves}</div>
                <div className="text-[11px] font-semibold text-amber-700">Terneros</div>
                <div className="text-[10px] text-amber-600">0 - {calfMax} m</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
                <div className="text-lg font-bold text-blue-800">{stageStats.weaned}</div>
                <div className="text-[11px] font-semibold text-blue-700">Levante</div>
                <div className="text-[10px] text-blue-600">{calfMax} - {weanedMax} m</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                <div className="text-lg font-bold text-emerald-800">{stageStats.juveniles}</div>
                <div className="text-[11px] font-semibold text-emerald-700">Novillos/as</div>
                <div className="text-[10px] text-emerald-600">{weanedMax} - {juvenileMax} m</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5">
                <div className="text-lg font-bold text-purple-800">{stageStats.adults}</div>
                <div className="text-[11px] font-semibold text-purple-700">Adultos</div>
                <div className="text-[10px] text-purple-600">&gt; {juvenileMax} m</div>
              </div>
            </div>
          </div>

          {/* Transition Candidates List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Animales Pendientes por Transicionar ({candidates.length})
              </h4>
              <span className="text-xs text-gray-500">
                {candidates.length > 0 ? 'Requieren actualizar ficha' : 'Todo el hato está al día'}
              </span>
            </div>

            {candidates.length === 0 ? (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-emerald-900">
                  ¡Excelente! Todos los animales de esta finca tienen su etapa actualizada conforme a su edad.
                </p>
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-2 bg-gray-50/50">
                {candidates.map(c => (
                  <div key={c.animal.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900">{c.animal.earTagCode}</span>
                        {c.animal.name && <span className="text-xs text-gray-500">({c.animal.name})</span>}
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                          {c.ageMonths} meses
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{c.reason}</div>
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs font-semibold shrink-0">
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 line-through">
                        {StageTransitionEngine.getStageLabel(c.currentStage, c.animal.gender)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">
                        {StageTransitionEngine.getStageLabel(c.recommendedStage, c.animal.gender)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-700 shrink-0" />
              {successMessage}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-5 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleSaveConfig}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-2xs text-xs font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-100 transition-colors"
          >
            <Save className="w-4 h-4 mr-1.5 text-gray-500" />
            Guardar Reglas Solamente
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
            >
              Cerrar
            </button>

            <button
              onClick={handleApplyTransitions}
              disabled={isApplying || candidates.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 border border-transparent shadow-xs text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-yellow-300" />
              {isApplying ? 'Reclasificando...' : `Reclasificar ${candidates.length} Animales Ahora`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
