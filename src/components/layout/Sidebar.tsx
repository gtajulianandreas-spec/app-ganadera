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
    <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="p-4 flex-1 space-y-1">
        <p className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          Módulos de la Finca
        </p>
        
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                isActive
                  ? 'bg-ranch-600 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              } ${item.special && !isActive ? 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100' : ''}`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className={`w-5 h-5 shrink-0 ${
                  isActive ? 'text-white' : item.special ? 'text-emerald-600' : 'text-gray-500 group-hover:text-gray-700'
                }`} />
                <div className="truncate">
                  <div className="truncate font-semibold">{item.label}</div>
                  <div className={`text-xs truncate ${isActive ? 'text-ranch-100' : 'text-gray-400'}`}>
                    {item.description}
                  </div>
                </div>
              </div>

              {item.badge !== undefined && (
                <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
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
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex items-center justify-between">
        <span>APP GANADERA v1.0</span>
        <span className="flex items-center text-emerald-600 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
          Offline Ready
        </span>
      </div>
    </aside>
  );
};
