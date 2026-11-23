import React, { useState } from 'react';
import { 
  Users, 
  GitBranch, 
  Milk, 
  Plus, 
  DollarSign, 
  Menu, 
  X, 
  Camera, 
  Scale, 
  HeartPulse, 
  Sparkles, 
  Database, 
  Layers, 
  Smartphone,
  ShieldCheck,
  Bell,
  Settings2,
  Share2,
  Radio,
  Dna
} from 'lucide-react';
import type { AppTab } from './Sidebar';
import type { UserRole } from '../../types/userRole';
import { USER_ROLES } from '../../types/userRole';

interface MobileTabBarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenCreateAnimal: () => void;
  onOpenVisualSearch: () => void;
  onOpenAi: () => void;
  onOpenBackup: () => void;
  onOpenBulk: () => void;
  onOpenMobileTester: () => void;
  onOpenAlerts?: () => void;
  onOpenShare?: () => void;
  onOpenScanner?: () => void;
  currentRole?: UserRole;
  onChangeRole?: (role: UserRole) => void;
  alertCount?: number;
  counts?: {
    animals: number;
    pregnant: number;
    milking: number;
  };
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateAnimal,
  onOpenVisualSearch,
  onOpenAi,
  onOpenBackup,
  onOpenBulk,
  onOpenMobileTester,
  onOpenAlerts,
  onOpenShare,
  onOpenScanner,
  currentRole,
  onChangeRole,
  alertCount = 0,
  counts
}) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <>
      {/* Bottom Bar: Visible only on mobile screens (hidden on md+) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1 flex items-center justify-around md:hidden shadow-lg safe-bottom">
        {/* Tab 1: Ganado */}
        <button
          onClick={() => {
            onSelectTab('animals');
            setIsActionSheetOpen(false);
            setIsMoreMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors relative ${
            currentTab === 'animals' ? 'text-ranch-600 font-bold' : 'text-gray-500'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {counts?.animals ? (
              <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 py-0.2 bg-ranch-100 text-ranch-800 rounded-full">
                {counts.animals}
              </span>
            ) : null}
          </div>
          <span className="text-[10px] mt-1">Ganado</span>
        </button>

        {/* Tab 2: Reproducción */}
        <button
          onClick={() => {
            onSelectTab('reproduction');
            setIsActionSheetOpen(false);
            setIsMoreMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors relative ${
            currentTab === 'reproduction' ? 'text-ranch-600 font-bold' : 'text-gray-500'
          }`}
        >
          <div className="relative">
            <GitBranch className="w-5 h-5" />
            {counts?.pregnant ? (
              <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 py-0.2 bg-amber-100 text-amber-800 rounded-full">
                {counts.pregnant}
              </span>
            ) : null}
          </div>
          <span className="text-[10px] mt-1">Preñez</span>
        </button>

        {/* Center Quick Action Floating Button (FAB) */}
        <div className="flex flex-col items-center justify-center -mt-6">
          <button
            onClick={() => {
              setIsActionSheetOpen(true);
              setIsMoreMenuOpen(false);
            }}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-ranch-600 to-emerald-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-white"
            title="Acción rápida de potrero"
          >
            <Plus className="w-6 h-6" />
          </button>
          <span className="text-[9px] text-gray-500 font-semibold mt-0.5">Acción</span>
        </div>

        {/* Tab 3: Ordeño */}
        <button
          onClick={() => {
            onSelectTab('milking');
            setIsActionSheetOpen(false);
            setIsMoreMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors relative ${
            currentTab === 'milking' ? 'text-ranch-600 font-bold' : 'text-gray-500'
          }`}
        >
          <div className="relative">
            <Milk className="w-5 h-5" />
            {counts?.milking ? (
              <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 py-0.2 bg-blue-100 text-blue-800 rounded-full">
                {counts.milking}
              </span>
            ) : null}
          </div>
          <span className="text-[10px] mt-1">Ordeño</span>
        </button>

        {/* Tab 4: Menú Más */}
        <button
          onClick={() => {
            setIsMoreMenuOpen(true);
            setIsActionSheetOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors relative ${
            isMoreMenuOpen ? 'text-ranch-600 font-bold' : 'text-gray-500'
          }`}
        >
          <div className="relative">
            <Menu className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 py-0.2 bg-rose-600 text-white rounded-full animate-pulse">
                {alertCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Más</span>
        </button>
      </nav>

      {/* Floating Action Sheet Modal */}
      {isActionSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto safe-bottom">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-sm">Acciones Rápidas en Potrero</h3>
              <button
                onClick={() => setIsActionSheetOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenVisualSearch();
                }}
                className="flex items-center space-x-3 p-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-sm active:scale-98 transition-transform"
              >
                <Camera className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <div>Buscar por Foto</div>
                  <div className="text-[10px] font-normal text-emerald-100">Cámara o galería</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onOpenCreateAnimal();
                }}
                className="flex items-center space-x-3 p-3.5 rounded-2xl bg-ranch-600 text-white font-bold text-xs shadow-sm active:scale-98 transition-transform"
              >
                <Plus className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <div>Nuevo Animal</div>
                  <div className="text-[10px] font-normal text-ranch-100">Con foto y arete</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onSelectTab('milking');
                }}
                className="flex items-center space-x-3 p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-xs transition-colors"
              >
                <Milk className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-left">
                  <div>Registrar Ordeño</div>
                  <div className="text-[10px] font-normal text-blue-600">AM / PM por vaca</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onSelectTab('weights');
                }}
                className="flex items-center space-x-3 p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs transition-colors"
              >
                <Scale className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-left">
                  <div>Pesaje en Báscula</div>
                  <div className="text-[10px] font-normal text-amber-600">Captura Tru-Test / GDP</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Más" Drawer Sheet (Finances, Health, Alerts, QA, Backup, AI) */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto safe-bottom">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-ranch-600 text-white font-bold flex items-center justify-center text-xs">
                  AG
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Menú Principal y Módulos</h3>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Role Selector on Mobile */}
            {onChangeRole && currentRole && (
              <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-2xl">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Perfil de Usuario</span>
                  <span className="text-ranch-700 font-extrabold bg-ranch-100 px-2 py-0.5 rounded-md text-[10px]">
                    {USER_ROLES[currentRole].shortLabel}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(USER_ROLES) as UserRole[]).map(roleKey => {
                    const isSelected = currentRole === roleKey;
                    return (
                      <button
                        key={roleKey}
                        onClick={() => onChangeRole(roleKey)}
                        className={`py-1.5 px-1.5 rounded-xl text-[11px] font-bold transition-all text-center truncate ${
                          isSelected
                            ? 'bg-ranch-600 text-white shadow-xs'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {USER_ROLES[roleKey].shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Share & Feedback Button for Remote Testers */}
            {onOpenShare && (
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenShare();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-ranch-700 to-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs">Compartir App & Feedback WhatsApp</div>
                    <div className="text-[10px] text-emerald-200">Invitar a otros ganaderos o reportar sugerencias</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  Piloto
                </span>
              </button>
            )}

            {/* Smart Alerts Center Row */}
            {onOpenAlerts && (
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenAlerts();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-50 text-rose-950 border border-rose-200 font-bold text-xs shadow-2xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div>Centro de Alertas Ganaderas</div>
                    <div className="text-[10px] font-normal text-rose-700">Retiros, secados, partos y celos</div>
                  </div>
                </div>
                {alertCount > 0 && (
                  <span className="text-xs bg-rose-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                    {alertCount} activas
                  </span>
                )}
              </button>
            )}

            {/* Universal Chip Scanner Button */}
            {onOpenScanner && (
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenScanner();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs">Lector Universal Chip RFID & NFC</div>
                    <div className="text-[10px] text-amber-100">Escanear aretes electrónicos o cámaras QR</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  NFC / ISO
                </span>
              </button>
            )}

            {/* QA Testing Banner Highlight */}
            <button
              onClick={() => {
                setIsMoreMenuOpen(false);
                onOpenMobileTester();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-xs">Panel de Pruebas Móviles & QA</div>
                  <div className="text-[10px] text-purple-200">Simulador de señal rural, RFID y báscula</div>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                Test Suite
              </span>
            </button>

            {/* AI Assistant */}
            <button
              onClick={() => {
                setIsMoreMenuOpen(false);
                onOpenAi();
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs text-left"
            >
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div>Asistente con Inteligencia Artificial</div>
                <div className="text-[10px] font-normal text-emerald-700">Consultas del hato y zootecnia global</div>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onSelectTab('finance');
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-semibold text-left"
              >
                <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Finanzas y Margen</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onSelectTab('health');
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-semibold text-left"
              >
                <HeartPulse className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Sanidad y Retiro</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onSelectTab('weights');
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-semibold text-left"
              >
                <Scale className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pesaje y Ceba</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenBulk();
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-semibold text-left"
              >
                <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Carga Masiva Excel</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenBackup();
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-semibold text-left col-span-2"
              >
                <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Copias de Seguridad y Respaldos Locales</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
