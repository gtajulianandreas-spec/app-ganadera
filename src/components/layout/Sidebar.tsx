import React from 'react';
import { 
  Users, 
  GitBranch, 
  Milk, 
  Scale, 
  DollarSign, 
  Layers, 
  Sparkles, 
  Database,
  HeartPulse,
  Home,
  Dna
} from 'lucide-react';

export type AppTab = 
  | 'animals'
  | 'reproduction'
  | 'milking'
  | 'weights'
  | 'zootechnician'
  | 'finance'
  | 'health'
  | 'bulk'
  | 'ai'
  | 'backup';

interface SidebarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  counts?: {
    animals: number;
    pregnant: number;
    milking: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  counts
}) => {
  const menuItems = [
    {
      id: 'animals' as AppTab,
      label: 'Inventario de Ganado',
      icon: Users,
      badge: counts?.animals,
      description: 'Fichas, aretes, razas y lotes'
    },
    {
      id: 'reproduction' as AppTab,
      label: 'Control Reproductivo',
      icon: GitBranch,
      badge: counts?.pregnant,
      badgeColor: 'bg-amber-100 text-amber-800',
      description: 'Gestación, partos y secado'
    },
    {
      id: 'milking' as AppTab,
      label: 'Producción de Leche',
      icon: Milk,
      badge: counts?.milking,
      badgeColor: 'bg-blue-100 text-blue-800',
      description: 'Ordeños AM/PM y curvas'
    },
    {
      id: 'weights' as AppTab,
      label: 'Pesaje y Ceba',
      icon: Scale,
      description: 'Básculas y ganancia diaria (GDP)'
    },
    {
      id: 'zootechnician' as AppTab,
      label: 'Zootecnia y Curvas',
      icon: Dna,
      description: 'GDP, lactancia y condición corporal'
    },
    {
      id: 'finance' as AppTab,
      label: 'Finanzas y Rentabilidad',
      icon: DollarSign,
      highlight: true,
      description: 'Costo por litro, costo/kg y margen'
    },
    {
      id: 'health' as AppTab,
      label: 'Sanidad y Mastitis',
      icon: HeartPulse,
      description: 'Vacunas y períodos de retiro'
    },
    {
      id: 'bulk' as AppTab,
      label: 'Gestión Masiva Excel',
      icon: Layers,
      description: 'Importar y exportar lotes'
    },
    {
      id: 'ai' as AppTab,
      label: 'Asistente IA Ganadero',
      icon: Sparkles,
      special: true,
      description: 'Diagnósticos y recomendaciones'
    },
    {
      id: 'backup' as AppTab,
      label: 'Respaldos y Autosave',
      icon: Database,
      description: 'Copias de seguridad locales'
    }
  ];

  return (
    <aside className="w-full md:w-[264px] bg-white rounded-2xl border border-gray-200/90 flex flex-col shrink-0 shadow-2xs overflow-hidden self-start sticky top-20">
      <div className="p-3 flex-1 space-y-1">
        <p className="px-3 pt-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Módulos de la Finca
        </p>
        
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={item.description}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-between group ${
                isActive
                  ? 'bg-ranch-600 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-950'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-white'
                    : item.special
                    ? 'text-ranch-600'
                    : 'text-gray-400 group-hover:text-gray-700'
                }`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className={`ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums shrink-0 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : item.badgeColor || 'bg-gray-100 text-gray-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 border-t border-[#E5E3DA] bg-[#F6F5EF]/70 text-[11px] text-[#69766C] flex items-center justify-between">
        <span className="font-semibold text-[#1A3627] flex items-center space-x-1.5">
          <img src="/brand/haterra-mark-transparent.svg" alt="" aria-hidden="true" className="h-3.5 w-auto object-contain" />
          <span>HATERRA v1.0</span>
        </span>
        <span className="flex items-center text-emerald-700 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          Offline Ready
        </span>
      </div>
    </aside>
  );
};
