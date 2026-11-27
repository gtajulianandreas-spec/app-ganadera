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
import { useFarmContext } from '../../context/FarmContext';
import { useOptionalAuth } from '../../context/AuthContext';
import { LogIn, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  farms?: Farm[];
  selectedFarmId?: string; // 'all' or farm.id
  onSelectFarm?: (farmId: string) => void;
  onOpenCreateFarm: () => void;
  onOpenAi: () => void;
  onOpenBackup: () => void;
  onOpenBulk: () => void;
  onOpenMobileTester: () => void;
  onOpenShare?: () => void;
  onOpenScanner?: () => void;
  onOpenAuth?: () => void;
  onOpenAccount?: () => void;
  currentTab: string;
  currentRole?: UserRole;
  onChangeRole?: (role: UserRole) => void;
  onOpenAlerts?: () => void;
  alertCount?: number;
  onOpenStageConfig?: () => void;
  isSimulatedMobile?: boolean;
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
  onOpenAuth,
  onOpenAccount,
  currentRole,
  onChangeRole,
  onOpenAlerts,
  alertCount = 0,
  onOpenStageConfig,
  isSimulatedMobile = false
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFarmDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(e.target as Node)) {
        setIsToolsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFarmDropdownOpen(false);
        setIsRoleDropdownOpen(false);
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await syncEngine.triggerSync();
    setTimeout(() => setIsManualSyncing(false), 500);
  };

  const handleInstallClick = async () => {
    await pwaManager.triggerInstallPrompt();
  };

  let farmContext: ReturnType<typeof useFarmContext> | null = null;
  try {
    farmContext = useFarmContext();
  } catch {
    // optional fallback if rendered outside provider
  }

  const effectiveFarms = farms || farmContext?.farms || [];
  const effectiveSelectedFarmId = selectedFarmId || farmContext?.selectedFarmId || 'all';
  const effectiveOnSelectFarm = onSelectFarm || farmContext?.setSelectedFarmId || (() => {});
  const effectiveRole = currentRole || farmContext?.currentRole || 'admin';
  const effectiveOnChangeRole = onChangeRole || farmContext?.setCurrentRole || (() => {});

  const authContext = useOptionalAuth();
  const isAuthenticated = authContext?.isAuthenticated || false;
  const authUser = authContext?.user || null;

  const currentFarm = effectiveFarms.find(f => f.id === effectiveSelectedFarmId);
  const isGlobalView = effectiveSelectedFarmId === 'all';
  const roleInfo = USER_ROLES[effectiveRole];

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-[#E5E3DA] sticky top-0 z-30 shadow-xs safe-top">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* HATERRA Brand Logo & Farm Selector (Left Group) */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 shrink">
            <img
              src="/brand/haterra-lockup-horizontal-light.svg"
              alt="HATERRA"
              className="hidden sm:block h-9 w-auto rounded-lg object-contain shrink-0"
            />
            <img
              src="/brand/haterra-mark-transparent.svg"
              alt="HATERRA"
              className="sm:hidden h-8 w-auto object-contain shrink-0"
            />

            {/* Farm Selector Pill with Dropdown */}
            <div className="relative min-w-0" ref={dropdownRef}>
              <button
                onClick={() => setIsFarmDropdownOpen(!isFarmDropdownOpen)}
                className="flex items-center space-x-1.5 text-left p-1 sm:p-1.5 rounded-xl hover:bg-gray-100 transition-colors group min-w-0"
                title="Cambiar de finca o ver consolidado global"
              >
                <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-100 group-hover:bg-white text-gray-700 border border-gray-200 shrink-0">
                  {isGlobalView ? (
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5 text-ranch-700" />
                  )}
                </div>

                <div className="min-w-0 truncate">
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm tracking-tight truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-[240px]">
                      {isGlobalView ? 'Todas las Fincas' : currentFarm?.name || 'Hacienda'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-700 transition-transform shrink-0" />
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate hidden sm:block">
                    {isGlobalView 
                      ? `${effectiveFarms.length} fincas consolidadas` 
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
                      effectiveOnSelectFarm('all');
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
                        <div className="font-semibold text-gray-900">Todas las Fincas (Global)</div>
                        <div className="text-[11px] text-gray-500">Métricas consolidadas de todo el hato</div>
                      </div>
                    </div>
                    {isGlobalView && <Check className="w-4 h-4 text-blue-600" />}
                  </button>

                  <div className="my-1 border-t border-gray-100" />

                  {/* Individual Farms */}
                  <div className="max-h-56 overflow-y-auto">
                    {effectiveFarms.map(farm => {
                      const isSelected = effectiveSelectedFarmId === farm.id;
                      return (
                        <button
                          key={farm.id}
                          onClick={() => {
                            effectiveOnSelectFarm(farm.id);
                            setIsFarmDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-ranch-50/90 font-semibold text-ranch-900' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-ranch-100 text-ranch-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <div className="font-semibold text-gray-900 truncate">{farm.name}</div>
                              <div className={`text-[11px] truncate ${isSelected ? 'text-ranch-700/80' : 'text-gray-500'}`}>
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
          </div>

          {/* Action Toolbar (Right Group) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Sync State Quick Button (Compact on all screens) */}
            <button
              onClick={handleManualSync}
              disabled={isManualSyncing || syncStatus === 'offline'}
              title={
                syncStatus === 'offline'
                  ? 'Modo Offline: datos guardados en almacenamiento local seguro'
                  : syncStatus === 'syncing' || isManualSyncing
                  ? 'Sincronizando cambios locales con el servidor...'
                  : pendingCount === 0
                  ? 'Base de datos sincronizada'
                  : `${pendingCount} cambios pendientes por sincronizar (clic para forzar)`
              }
              className="relative inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors shrink-0 disabled:opacity-50"
            >
              {syncStatus === 'offline' ? (
                <WifiOff className="w-4 h-4 text-amber-600" />
              ) : syncStatus === 'syncing' || isManualSyncing ? (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4 text-emerald-600" />
              )}
              {pendingCount > 0 && syncStatus !== 'offline' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              )}
            </button>

            {/* Smart Alerts Button with Counter */}
            {onOpenAlerts && (
              <button
                onClick={onOpenAlerts}
                className="relative inline-flex items-center justify-center h-8 sm:h-9 w-8 sm:w-auto px-2 sm:px-2.5 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 transition-colors shrink-0"
                title="Centro de Alertas Ganaderas (Retiros, Secados, Partos, Celos)"
              >
                <Bell className="w-4 h-4 text-gray-700" />
                {!isSimulatedMobile && <span className="hidden xl:inline ml-1.5">Alertas</span>}
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:static sm:ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                    {alertCount}
                  </span>
                )}
              </button>
            )}

            {/* Consolidated Tools & Actions Dropdown */}
            <div className="relative" ref={toolsDropdownRef}>
              <button
                onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                className="relative inline-flex items-center justify-center h-8 sm:h-9 px-2 sm:px-2.5 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 transition-colors shrink-0"
                title="Herramientas y Acciones del Sistema"
              >
                <Settings2 className="w-4 h-4 text-gray-700" />
                {!isSimulatedMobile && <span className="hidden lg:inline ml-1.5 font-semibold">Herramientas</span>}
                {!isSimulatedMobile && <ChevronDown className="hidden lg:inline w-3 h-3 text-gray-400 ml-1" />}
                {canInstallPwa && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>

              {isToolsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Herramientas y Sistema</span>
                    {canInstallPwa && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                        PWA Lista
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setIsToolsDropdownOpen(false);
                      onOpenBulk();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-left hover:bg-gray-50 text-gray-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Gestión Masiva Excel</div>
                      <div className="text-[11px] text-gray-400">Importar o exportar hatos por lote</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsToolsDropdownOpen(false);
                      onOpenBackup();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-left hover:bg-gray-50 text-gray-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Copias de Respaldo</div>
                      <div className="text-[11px] text-gray-400">Descargar o restaurar base local</div>
                    </div>
                  </button>

                  {onOpenScanner && (
                    <button
                      onClick={() => {
                        setIsToolsDropdownOpen(false);
                        onOpenScanner();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-left hover:bg-gray-50 text-gray-800 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Radio className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Lector Chip RFID / NFC</div>
                        <div className="text-[11px] text-gray-400">Escanear aretes electrónicos y bolos</div>
                      </div>
                    </button>
                  )}

                  {onOpenStageConfig && (
                    <button
                      onClick={() => {
                        setIsToolsDropdownOpen(false);
                        onOpenStageConfig();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-left hover:bg-gray-50 text-gray-800 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Settings2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Ciclo de Vida y Transiciones</div>
                        <div className="text-[11px] text-gray-400">Pesos y edades para cambio de etapa</div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsToolsDropdownOpen(false);
                      onOpenMobileTester();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-left hover:bg-gray-50 text-gray-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Simulador Móvil QA</div>
                      <div className="text-[11px] text-gray-400">Probar tamaños de pantalla y campo</div>
                    </div>
                  </button>

                  {canInstallPwa && (
                    <button
                      onClick={() => {
                        setIsToolsDropdownOpen(false);
                        handleInstallClick();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-left bg-ranch-50/70 hover:bg-ranch-100/70 text-ranch-900 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-ranch-600 text-white flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-ranch-900">Instalar Aplicación (PWA)</div>
                        <div className="text-[11px] text-ranch-700">Acceso directo y soporte offline</div>
                      </div>
                    </button>
                  )}

                  {(onOpenAuth || onOpenAccount) && (
                    <button
                      onClick={() => {
                        setIsToolsDropdownOpen(false);
                        if (isAuthenticated && onOpenAccount) onOpenAccount();
                        else if (onOpenAuth) onOpenAuth();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-left hover:bg-gray-50 text-gray-800 transition-colors border-t border-gray-100"
                    >
                      <div className="w-7 h-7 rounded-lg bg-ranch-50 text-ranch-700 flex items-center justify-center shrink-0">
                        {isAuthenticated ? <UserIcon className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {isAuthenticated ? 'Mi Cuenta y Seguridad' : 'Iniciar Sesión / Registro'}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {isAuthenticated ? authUser?.email : 'Google, correo y privacidad Ley 1581'}
                        </div>
                      </div>
                    </button>
                  )}

                  {onOpenShare && (
                    <button
                      onClick={() => {
                        setIsToolsDropdownOpen(false);
                        onOpenShare();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-left hover:bg-gray-50 text-gray-800 transition-colors border-t border-gray-100"
                    >
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Compartir y Feedback</div>
                        <div className="text-[11px] text-gray-400">Invitar ganaderos o reportar sugerencia</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* User Role Switcher Dropdown (Desktop / Wide screens only) */}
            {!isSimulatedMobile && (
              <div className="relative hidden md:block" ref={roleDropdownRef}>
                <button
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="flex items-center space-x-1.5 h-8 sm:h-9 px-2.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 transition-colors text-xs font-bold text-gray-800 border border-gray-200 shrink-0"
                  title="Cambiar perfil de usuario y funciones específicas"
                >
                  {effectiveRole === 'admin' && <Shield className="w-3.5 h-3.5 text-ranch-700" />}
                  {effectiveRole === 'zootechnician' && <Dna className="w-3.5 h-3.5 text-emerald-600" />}
                  {effectiveRole === 'investor' && <Briefcase className="w-3.5 h-3.5 text-indigo-600" />}
                  {effectiveRole === 'veterinarian' && <Stethoscope className="w-3.5 h-3.5 text-rose-600" />}
                  {effectiveRole === 'worker' && <UserCheck className="w-3.5 h-3.5 text-amber-600" />}
                  
                  <span className="hidden xl:inline">{roleInfo.shortLabel}</span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>

                {isRoleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Cambiar Perfil de Usuario
                    </div>

                    {(Object.keys(USER_ROLES) as UserRole[]).map(roleKey => {
                      const r = USER_ROLES[roleKey];
                      const isSelected = effectiveRole === roleKey;
                      return (
                        <button
                          key={roleKey}
                          onClick={() => {
                            effectiveOnChangeRole(roleKey);
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
            )}

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAi}
              className="inline-flex items-center justify-center h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-ranch-600 to-emerald-600 text-white shadow-xs hover:from-ranch-700 hover:to-emerald-700 transition-all shrink-0"
              title="Asistente de Inteligencia Artificial Ganadera"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 animate-pulse" />
              <span className="ml-1 sm:ml-1.5 font-black text-xs">IA</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
