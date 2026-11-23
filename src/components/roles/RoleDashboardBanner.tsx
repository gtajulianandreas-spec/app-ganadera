import React from 'react';
import { 
  Briefcase, 
  Dna, 
  Stethoscope, 
  UserCheck, 
  Shield, 
  Settings2, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import type { UserRole } from '../../types/userRole';
import { USER_ROLES } from '../../types/userRole';

interface RoleDashboardBannerProps {
  currentRole: UserRole;
  onOpenStageConfig?: () => void;
  onOpenInvestorView?: () => void;
  onSelectTab?: (tab: any) => void;
  withdrawalCount?: number;
  transitionCount?: number;
}

export const RoleDashboardBanner: React.FC<RoleDashboardBannerProps> = ({
  currentRole,
  onOpenStageConfig,
  onOpenInvestorView,
  onSelectTab,
  withdrawalCount = 0,
  transitionCount = 0
}) => {
  const roleInfo = USER_ROLES[currentRole];

  if (currentRole === 'admin') {
    return null; // Standard full dashboard, no extra banner needed
  }

  return (
    <div className="mb-4 sm:mb-6 rounded-2xl border overflow-hidden shadow-2xs transition-all animate-in fade-in duration-150">
      
      {/* Zootechnician Custom Banner */}
      {currentRole === 'zootechnician' && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Modo Zootécnico Activo</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 font-semibold">
                  Nutrición, Ganancia Diaria & Genética
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                {transitionCount > 0 
                  ? `Hay ${transitionCount} animales listos para transicionar de etapa según su edad.`
                  : 'Todas las etapas de crecimiento están al día conforme a la edad del hato.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {onOpenStageConfig && (
              <button
                onClick={onOpenStageConfig}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 transition-colors shadow-xs"
              >
                <Settings2 className="w-4 h-4 mr-1.5" />
                Configurar Etapas de Transición ({transitionCount})
              </button>
            )}
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('weights')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <TrendingUp className="w-4 h-4 mr-1.5 text-emerald-300" />
                Curvas de Ganancia (GDP)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Investor Custom Banner */}
      {currentRole === 'investor' && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-400/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Modo Inversionista Activo</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-100 font-semibold">
                  Patrimonio y Rentabilidad
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Visualización financiera ejecutiva sin formularios operativos de campo.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('finance')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-400 text-indigo-950 transition-colors shadow-xs"
              >
                <TrendingUp className="w-4 h-4 mr-1.5" />
                Ver Portafolio de Inversión y Rentabilidad / Ha
              </button>
            )}
          </div>
        </div>
      )}

      {/* Veterinarian Custom Banner */}
      {currentRole === 'veterinarian' && (
        <div className="bg-gradient-to-r from-rose-950 via-red-900 to-rose-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 border border-rose-400/30">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">Modo Veterinario Activo</span>
                {withdrawalCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/40 text-rose-100 font-bold flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1 text-rose-300" />
                    {withdrawalCount} animales en período de retiro
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-200 mt-0.5">
                Control de dosis exactas, vías de aplicación, sanidad y chequeos reproductivos.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('health')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-400 text-rose-950 transition-colors shadow-xs"
              >
                Sanidad y Retiros ({withdrawalCount})
              </button>
            )}
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('reproduction')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Secados & Partos
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mayordomo / Worker Custom Banner */}
      {currentRole === 'worker' && (
        <div className="bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Modo Mayordomo / Operario</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-100 font-semibold">
                  Operación Rápida de Campo
                </span>
              </div>
              <p className="text-xs text-amber-200 mt-0.5">
                Botones táctiles grandes para pesaje en báscula, ordeño diario y lectura de chips RFID.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('milking')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 transition-colors shadow-xs"
              >
                🥛 Registrar Ordeño
              </button>
            )}
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('weights')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                ⚖️ Registrar Pesaje
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
