import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Sparkles, 
  Database, 
  Layers, 
  Building2, 
  Globe, 
  ChevronDown, 
  Plus, 
  Check, 
  Smartphone, 
  Download,
  Bell,
  Settings2,
  Briefcase,
  Dna,
  Stethoscope,
  UserCheck,
  Shield,
  Share2,
  Radio
} from 'lucide-react';
import { syncEngine } from '../../sync/engine';
import type { SyncStatus } from '../../types/sync';
import type { Farm } from '../../types/animal';
import type { UserRole } from '../../types/userRole';
import { USER_ROLES } from '../../types/userRole';
import { pwaManager } from '../../pwa';

interface NavbarProps {
  farms: Farm[];
  selectedFarmId: string; // 'all' or farm.id
  onSelectFarm: (farmId: string) => void;
  onOpenCreateFarm: () => void;
  onOpenAi: () => void;
  onOpenBackup: () => void;
  onOpenBulk: () => void;
  onOpenMobileTester: () => void;
  onOpenShare?: () => void;
  onOpenScanner?: () => void;
  currentTab: string;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onOpenAlerts?: () => void;
  alertCount?: number;
  onOpenStageConfig?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  farms,
  selectedFarmId,
  onSelectFarm,
  onOpenCreateFarm,
  onOpenAi,
  onOpenBackup,
  onOpenBulk,
  onOpenMobileTester,
  onOpenShare,
  onOpenScanner,
  currentRole,
  onChangeRole,
  onOpenAlerts,
  alertCount = 0,
  onOpenStageConfig
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeSync = syncEngine.subscribeStatus((status, count) => {
      setSyncStatus(status);
      setPendingCount(count);
    });

    const unsubscribePwa = pwaManager.subscribe((canInstall) => {
      setCanInstallPwa(canInstall);
    });

    return () => {
      unsubscribeSync();
      unsubscribePwa();
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFarmDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await syncEngine.triggerSync();
    setTimeout(() => setIsManualSyncing(false), 500);
  };

  const handleInstallClick = async () => {
    await pwaManager.triggerInstallPrompt();
  };

  const currentFarm = farms.find(f => f.id === selectedFarmId);
  const isGlobalView = selectedFarmId === 'all';
  const roleInfo = USER_ROLES[currentRole];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs safe-top">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo, Farm Selector & User Role Pill */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-ranch-600 flex items-center justify-center text-white shadow-xs font-bold text-base sm:text-xl tracking-tight shrink-0">
              AG
            </div>

            {/* Farm Selector Pill with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsFarmDropdownOpen(!isFarmDropdownOpen)}
                className="flex items-center space-x-1.5 sm:space-x-2 text-left p-1 sm:p-1.5 rounded-xl hover:bg-gray-100 transition-colors group"
                title="Cambiar de finca o ver consolidado global"
              >
                <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-100 group-hover:bg-white text-gray-700 border border-gray-200 shrink-0">
                  {isGlobalView ? (
                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ranch-700" />
                  )}
                </div>

                <div className="min-w-0 pr-1">
                  <div className="flex items-center space-x-1 sm:space-x-1.5">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm tracking-tight truncate max-w-[120px] sm:max-w-[180px]">
                      {isGlobalView ? 'Todas las Fincas' : currentFarm?.name || 'Hacienda'}
                    </span>
                    <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-bold bg-ranch-100 text-ranch-800 border border-ranch-200 uppercase">
                      {isGlobalView ? 'Global' : currentFarm?.purpose === 'milk' ? 'Leche' : currentFarm?.purpose === 'beef' ? 'Carne' : 'Doble'}
                    </span>
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 group-hover:text-gray-700 transition-transform" />
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate hidden sm:block">
                    {isGlobalView 
                      ? `${farms.length} fincas consolidadas` 
                      : `${currentFarm?.areaHectares || 0} Ha • ${currentFarm?.location || 'Finca activa'}`}
                  </p>
                </div>
              </button>

              {/* Farm Dropdown Menu */}
              {isFarmDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Seleccionar Hacienda o Visión
                  </div>

                  {/* Option: Global View */}
                  <button
                    onClick={() => {
                      onSelectFarm('all');
                      setIsFarmDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-gray-50 transition-colors ${
                      isGlobalView ? 'bg-blue-50/80 font-bold text-blue-900' : 'text-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-blue-700">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">🌐 Todas las Fincas (Global)</div>
                        <div className="text-[11px] text-gray-500">Métricas consolidadas de todo el hato</div>
                      </div>
                    </div>
                    {isGlobalView && <Check className="w-4 h-4 text-blue-600" />}
                  </button>

                  <div className="my-1 border-t border-gray-100" />

                  {/* Individual Farms */}
                  <div className="max-h-56 overflow-y-auto">
                    {farms.map(farm => {
                      const isSelected = selectedFarmId === farm.id;
                      return (
                        <button
                          key={farm.id}
                          onClick={() => {
                            onSelectFarm(farm.id);
                            setIsFarmDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-ranch-50 font-bold text-ranch-900' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <div className="font-semibold text-gray-900 truncate">{farm.name}</div>
                              <div className="text-[11px] text-gray-400 truncate">
                                {farm.areaHectares} Ha • {farm.location || farm.country}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-ranch-600 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="my-1 border-t border-gray-100" />

                  <button
                    onClick={() => {
                      setIsFarmDropdownOpen(false);
                      onOpenCreateFarm();
                    }}
                    className="w-full flex items-center px-3.5 py-2 text-xs font-semibold text-ranch-700 hover:bg-ranch-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 mr-2" />
                    Registrar Nueva Hacienda / Finca
                  </button>
                </div>
              )}
            </div>

            {/* User Role Switcher Dropdown (Desktop only in header; on mobile accessible in bottom drawer) */}
            <div className="relative hidden md:block" ref={roleDropdownRef}>
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200/80 transition-colors text-xs font-bold text-gray-800 border border-gray-200"
                title="Cambiar perfil de usuario y funciones específicas"
              >
                {currentRole === 'admin' && <Shield className="w-3.5 h-3.5 text-ranch-700" />}
                {currentRole === 'zootechnician' && <Dna className="w-3.5 h-3.5 text-emerald-600" />}
                {currentRole === 'investor' && <Briefcase className="w-3.5 h-3.5 text-indigo-600" />}
                {currentRole === 'veterinarian' && <Stethoscope className="w-3.5 h-3.5 text-rose-600" />}
                {currentRole === 'worker' && <UserCheck className="w-3.5 h-3.5 text-amber-600" />}
                
                <span className="hidden sm:inline">{roleInfo.shortLabel}</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Cambiar Perfil de Usuario
                  </div>

                  {(Object.keys(USER_ROLES) as UserRole[]).map(roleKey => {
                    const r = USER_ROLES[roleKey];
                    const isSelected = currentRole === roleKey;
                    return (
                      <button
                        key={roleKey}
                        onClick={() => {
                          onChangeRole(roleKey);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-start justify-between px-3.5 py-2.5 text-xs text-left hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-ranch-50 font-bold' : ''
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5 font-bold text-gray-900">
                            {roleKey === 'admin' && <Shield className="w-3.5 h-3.5 text-ranch-700" />}
                            {roleKey === 'zootechnician' && <Dna className="w-3.5 h-3.5 text-emerald-600" />}
                            {roleKey === 'investor' && <Briefcase className="w-3.5 h-3.5 text-indigo-600" />}
                            {roleKey === 'veterinarian' && <Stethoscope className="w-3.5 h-3.5 text-rose-600" />}
                            {roleKey === 'worker' && <UserCheck className="w-3.5 h-3.5 text-amber-600" />}
                            <span>{r.title}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-tight">
                            {r.description}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-ranch-600 shrink-0 ml-2 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            
            {/* Share & Feedback Button (Desktop only; on mobile available in bottom drawer) */}
            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className="hidden md:inline-flex items-center px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-2xs"
                title="Compartir con otros ganaderos y enviar sugerencias"
              >
                <Share2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Compartir</span>
              </button>
            )}

            {/* Universal Chip / RFID Scanner Button (Desktop only; on mobile available in search bar and bottom drawer) */}
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="hidden md:inline-flex items-center px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-2xs"
                title="Lector Universal de Chip RFID, NFC y Aretes"
              >
                <Radio className="w-3.5 h-3.5 mr-1 text-amber-600 animate-pulse" />
                <span>Lector Chip</span>
              </button>
            )}

            {/* Smart Alerts Button with Counter (Visible on all devices) */}
            {onOpenAlerts && (
              <button
                onClick={onOpenAlerts}
                className="relative inline-flex items-center p-2 sm:px-2.5 sm:py-1.5 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 transition-colors shrink-0"
                title="Centro de Alertas Ganaderas (Retiros, Secados, Partos, Celos)"
              >
                <Bell className="w-4 h-4 text-gray-700 sm:mr-1" />
                <span className="hidden sm:inline">Alertas</span>
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:static sm:ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                    {alertCount}
                  </span>
                )}
              </button>
            )}

            {/* QA Mobile Tester Button (Desktop only) */}
            <button
              onClick={onOpenMobileTester}
              className="hidden lg:inline-flex items-center px-2.5 py-1.5 text-xs font-bold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors shadow-2xs"
              title="Panel de Pruebas Móviles y Simuladores de Campo"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1 text-purple-600" />
              <span>Pruebas Móviles</span>
            </button>

            {/* PWA Install Button (If available, desktop only) */}
            {canInstallPwa && (
              <button
                onClick={handleInstallClick}
                className="hidden lg:inline-flex items-center px-2.5 py-1.5 text-xs font-bold rounded-lg bg-ranch-100 hover:bg-ranch-200 text-ranch-800 border border-ranch-300 transition-colors animate-pulse"
                title="Instalar App en este dispositivo"
              >
                <Download className="w-3.5 h-3.5 mr-1 text-ranch-700" />
                <span>Instalar App</span>
              </button>
            )}

            {/* Sync State Badge (Desktop only) */}
            <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium">
              {syncStatus === 'offline' ? (
                <span className="flex items-center text-amber-700" title="Sin conexión - Datos guardados en local">
                  <WifiOff className="w-3.5 h-3.5 text-amber-600 sm:mr-1" />
                  <span className="hidden sm:inline">Offline</span>
                </span>
              ) : syncStatus === 'syncing' || isManualSyncing ? (
                <span className="flex items-center text-blue-700">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 sm:mr-1" />
                  <span className="hidden sm:inline">Sincronizando</span>
                </span>
              ) : (
                <span className="flex items-center text-emerald-700" title="Sincronizado">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 sm:mr-1" />
                  <span className="hidden sm:inline">{pendingCount === 0 ? 'Sincronizado' : `${pendingCount} pend.`}</span>
                </span>
              )}

              {/* Sync Action Button */}
              <button
                onClick={handleManualSync}
                disabled={isManualSyncing || syncStatus === 'offline'}
                title="Sincronizar cambios locales ahora"
                className="ml-1.5 pl-1.5 border-l border-gray-300 text-gray-500 hover:text-ranch-700 disabled:opacity-40 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Desktop-only Action Buttons */}
            <button
              onClick={onOpenBulk}
              className="hidden lg:inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
              <span>Gestión Masiva</span>
            </button>

            <button
              onClick={onOpenBackup}
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
            >
              <Database className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span>Respaldos</span>
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAi}
              className="inline-flex items-center p-2 sm:px-3 sm:py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-ranch-600 to-emerald-600 text-white shadow-xs hover:from-ranch-700 hover:to-emerald-700 transition-all shrink-0"
              title="Asistente de Inteligencia Artificial"
            >
              <Sparkles className="w-4 h-4 sm:mr-1.5 animate-pulse text-yellow-300" />
              <span className="hidden sm:inline">Asistente</span>
              <span className="text-[11px] font-extrabold sm:text-xs">IA</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
