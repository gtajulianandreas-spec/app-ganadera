import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, type AppTab } from './components/layout/Sidebar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import type { SimulatedDevice } from './components/testing/MobileTesterDrawer';
import { AnimalList } from './components/animals/AnimalList';
import { AnimalDetailModal } from './components/animals/AnimalDetailModal';
import { CreateAnimalModal } from './components/animals/CreateAnimalModal';
import { CreateFarmModal } from './components/farms/CreateFarmModal';
import { VisualSearchModal } from './components/animals/VisualSearchModal';
import { ReproductionDashboard } from './components/reproduction/ReproductionDashboard';
import { MilkRecordsView } from './components/production/MilkRecordsView';
import { WeightRecordsView } from './components/production/WeightRecordsView';
import { HealthRecordsView } from './components/health/HealthRecordsView';
import { FinancialDashboard } from './components/finance/FinancialDashboard';
import { InvestorPortfolioView } from './components/finance/InvestorPortfolioView';
import { BackupRestoreModal } from './components/backup/BackupRestoreModal';
import { RoleDashboardBanner } from './components/roles/RoleDashboardBanner';
import { StageTransitionModal } from './components/animals/StageTransitionModal';
import { SmartAlertsModal } from './components/alerts/SmartAlertsModal';
import { ShareAndFeedbackModal } from './components/share/ShareAndFeedbackModal';
import { WelcomePilotModal } from './components/onboarding/WelcomePilotModal';
import { UniversalChipScannerModal } from './components/scanner/UniversalChipScannerModal';
import { ZootechnicianDashboard } from './components/zootechnician/ZootechnicianDashboard';

import { db } from './db';
import { seedDemoDataIfEmpty } from './db/seed';
import { syncEngine } from './sync/engine';
import { StageTransitionEngine } from './services/stageTransitionEngine';
import { computeSmartAlerts } from './services/alertsEngine';

import type { Animal, Lot, Pasture, Farm } from './types/animal';
import type { ReproductionEvent } from './types/reproduction';
import type { MilkingRecord, WeightRecord, HealthRecord } from './types/production';
import type { FinancialRecord } from './types/finance';
import type { UserRole } from './types/userRole';
import { FarmProvider, type FarmContextValue } from './context/FarmContext';
import { useOptionalAuth } from './context/AuthContext';
import { DeviceSimulatorFrame } from './components/testing/DeviceSimulatorFrame';

// Lazy loaded heavy modules for rapid initial FCP/LCP
const BulkManagerModal = React.lazy(() =>
  import('./components/bulk/BulkManagerModal').then(m => ({ default: m.BulkManagerModal }))
);
const MobileTesterDrawer = React.lazy(() =>
  import('./components/testing/MobileTesterDrawer').then(m => ({ default: m.MobileTesterDrawer }))
);
const CattleAiChatModal = React.lazy(() =>
  import('./components/ai/CattleAiChatModal').then(m => ({ default: m.CattleAiChatModal }))
);
const AuthModal = React.lazy(() =>
  import('./components/auth/AuthModal').then(m => ({ default: m.AuthModal }))
);
const AccountSecurityModal = React.lazy(() =>
  import('./components/account/AccountSecurityModal').then(m => ({ default: m.AccountSecurityModal }))
);

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppTab>('animals');
  const [isLoading, setIsLoading] = useState(true);

  // User Profile / Role (Zootecnista, Inversionista, Admin, etc.)
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  // Farms and active selection
  const [selectedFarmId, setSelectedFarmId] = useState<string>('farm-1');
  const isGlobal = selectedFarmId === 'all';

  // Reactive Dexie live queries (indexed by farmId in Dexie v3)
  const farms = useLiveQuery(() => db.farms.toArray(), [], [] as Farm[]);
  const displayedAnimals = useLiveQuery(
    () => (isGlobal ? db.animals.toArray() : db.animals.where('farmId').equals(selectedFarmId).toArray()),
    [isGlobal, selectedFarmId],
    [] as Animal[]
  );
  const displayedLots = useLiveQuery(
    () => (isGlobal ? db.lots.toArray() : db.lots.where('farmId').equals(selectedFarmId).toArray()),
    [isGlobal, selectedFarmId],
    [] as Lot[]
  );
  const displayedPastures = useLiveQuery(
    () => (isGlobal ? db.pastures.toArray() : db.pastures.where('farmId').equals(selectedFarmId).toArray()),
    [isGlobal, selectedFarmId],
    [] as Pasture[]
  );
  const displayedReproEvents = useLiveQuery(
    () => (isGlobal ? db.reproductionEvents.reverse().toArray() : db.reproductionEvents.where('farmId').equals(selectedFarmId).reverse().toArray()),
    [isGlobal, selectedFarmId],
    [] as ReproductionEvent[]
  );
  const displayedMilking = useLiveQuery(
    () => (isGlobal ? db.milkingRecords.reverse().toArray() : db.milkingRecords.where('farmId').equals(selectedFarmId).reverse().toArray()),
    [isGlobal, selectedFarmId],
    [] as MilkingRecord[]
  );
  const displayedWeights = useLiveQuery(
    () => (isGlobal ? db.weightRecords.reverse().toArray() : db.weightRecords.where('farmId').equals(selectedFarmId).reverse().toArray()),
    [isGlobal, selectedFarmId],
    [] as WeightRecord[]
  );
  const displayedHealth = useLiveQuery(
    () => (isGlobal ? db.healthRecords.reverse().toArray() : db.healthRecords.where('farmId').equals(selectedFarmId).reverse().toArray()),
    [isGlobal, selectedFarmId],
    [] as HealthRecord[]
  );
  const displayedFinances = useLiveQuery(
    () => (isGlobal ? db.financialRecords.reverse().toArray() : db.financialRecords.where('farmId').equals(selectedFarmId).reverse().toArray()),
    [isGlobal, selectedFarmId],
    [] as FinancialRecord[]
  );

  // Modals & Sheets
  const [selectedAnimalForDetail, setSelectedAnimalForDetail] = useState<Animal | null>(null);
  const [isCreateAnimalOpen, setIsCreateAnimalOpen] = useState(false);
  const [isCreateFarmOpen, setIsCreateFarmOpen] = useState(false);
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isMobileTesterOpen, setIsMobileTesterOpen] = useState(false);
  const [isStageConfigOpen, setIsStageConfigOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isChipScannerOpen, setIsChipScannerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [chipScanCallback, setChipScanCallback] = useState<((code: string) => void) | null>(null);
  const [activeDevice, setActiveDevice] = useState<SimulatedDevice>('none');

  const authState = useOptionalAuth();

  useEffect(() => {
    if (authState?.urlVerifyToken || authState?.urlResetToken || authState?.urlAuthError) {
      setIsAuthModalOpen(true);
    }
  }, [authState?.urlVerifyToken, authState?.urlResetToken, authState?.urlAuthError]);

  // Kept for backwards compatibility with child callbacks; useLiveQuery keeps state reactive automatically.
  const loadDatabaseState = useCallback(async () => {}, []);

  // Ensure selectedFarmId falls back to first available farm if removed
  useEffect(() => {
    if (selectedFarmId !== 'all' && farms.length > 0 && !farms.some(f => f.id === selectedFarmId)) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Initialize DB and Seed Data once on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await seedDemoDataIfEmpty();
      syncEngine.startPeriodicSync();
      setIsLoading(false);

      // Check if new tester should see welcome onboarding
      const hasSeen = localStorage.getItem('has_seen_pilot_welcome');
      if (!hasSeen) {
        setIsWelcomeOpen(true);
      }
    }
    init();

    return () => {
      syncEngine.stopPeriodicSync();
    };
  }, []);

  // Pre-warm lazy modules in background when browser is idle to ensure offline pasture readiness
  useEffect(() => {
    const prewarm = () => {
      import('./components/bulk/BulkManagerModal');
      import('./components/ai/CattleAiChatModal');
      if (import.meta.env.DEV || window.location.search.includes('qa=1')) {
        import('./components/testing/MobileTesterDrawer');
      }
    };
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(prewarm);
      } else {
        setTimeout(prewarm, 2000);
      }
    }
  }, []);

  const animalMap = useMemo(() => new Map(displayedAnimals.map(a => [a.id, a])), [displayedAnimals]);

  // Farm object for stage transitions
  const currentFarmObj = farms.find(f => f.id === selectedFarmId) || farms[0] || {
    id: 'default',
    name: 'Hacienda Principal',
    ownerName: 'Propietario',
    country: 'Colombia',
    currency: '$',
    areaHectares: 120,
    purpose: 'mixed',
    createdAt: Date.now(),
    updatedAt: Date.now()
  } as Farm;

  // Life Stage transition candidates
  const stageCandidates = useMemo(() => {
    return StageTransitionEngine.findTransitionCandidates(displayedAnimals, currentFarmObj?.stageConfig);
  }, [displayedAnimals, currentFarmObj]);

  // Unified Smart Alerts
  const smartAlerts = useMemo(
    () =>
      computeSmartAlerts({
        healthRecords: displayedHealth,
        reproEvents: displayedReproEvents,
        stageCandidates,
        animalMap
      }),
    [displayedHealth, displayedReproEvents, stageCandidates, animalMap]
  );

  // Tab switching from sidebar or shortcuts
  const handleSelectTab = (tab: AppTab) => {
    if (tab === 'bulk') {
      setIsBulkOpen(true);
    } else if (tab === 'ai') {
      setIsAiOpen(true);
    } else if (tab === 'backup') {
      setIsBackupOpen(true);
    } else {
      setCurrentTab(tab);
    }
  };

  const handleStartClean = async () => {
    setIsCreateAnimalOpen(true);
  };

  const handleStartDemo = async () => {
    await seedDemoDataIfEmpty();
    await loadDatabaseState();
  };

  // Badges
  const todayStr = new Date().toISOString().split('T')[0];
  const pregnantCount = displayedReproEvents.filter(r => r.eventType === 'pregnancy_check' && r.pregnancyResult === 'pregnant').length;
  const milkingCount = displayedAnimals.filter(a => a.purpose === 'milk' && a.gender === 'female' && a.currentStage === 'adult').length;
  const activeWithdrawalCount = displayedHealth.filter(h => (h.safeMilkDate && h.safeMilkDate >= todayStr) || (h.safeMeatDate && h.safeMeatDate >= todayStr)).length;

  // Centralized Farm & Role Context Value
  const farmContextValue: FarmContextValue = useMemo(() => ({
    selectedFarmId,
    setSelectedFarmId,
    farms,
    currentRole,
    setCurrentRole,
    isGlobalView: selectedFarmId === 'all',
    currentFarm: farms.find(f => f.id === selectedFarmId)
  }), [selectedFarmId, farms, currentRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-ranch-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg animate-pulse mb-4">
          AG
        </div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Cargando APP GANADERA...</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Inicializando base de datos local Dexie con soporte PWA Móvil y Perfiles Profesionales
        </p>
      </div>
    );
  }

  // Core App UI Content
  const appContent = (
    <FarmProvider value={farmContextValue}>
      <div className="min-h-screen bg-gray-50 flex flex-col antialiased pb-24 md:pb-8">
        {/* Top Application Bar with Multi-Farm and Role Selector */}
        <Navbar
          onOpenCreateFarm={() => setIsCreateFarmOpen(true)}
          currentTab={currentTab}
          onOpenAlerts={() => setIsAlertsOpen(true)}
          onOpenShare={() => setIsShareOpen(true)}
          onOpenScanner={() => setIsChipScannerOpen(true)}
          alertCount={smartAlerts.length}
          onOpenStageConfig={() => setIsStageConfigOpen(true)}
          onOpenAi={() => setIsAiOpen(true)}
          onOpenBackup={() => setIsBackupOpen(true)}
          onOpenBulk={() => setIsBulkOpen(true)}
          onOpenMobileTester={() => setIsMobileTesterOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenAccount={() => setIsAccountModalOpen(true)}
          isSimulatedMobile={activeDevice !== 'none'}
        />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 gap-4 sm:gap-6">
        {/* Navigation Sidebar (Desktop only) */}
        <div className="hidden md:block">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            counts={{
              animals: displayedAnimals.length,
              pregnant: pregnantCount,
              milking: milkingCount
            }}
          />
        </div>

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0">
          
          {/* Role Tailored Interactive Banner (Zootecnista, Inversionista, Veterinario, Mayordomo) */}
          <RoleDashboardBanner
            currentRole={currentRole}
            onOpenStageConfig={() => setIsStageConfigOpen(true)}
            onSelectTab={handleSelectTab}
            withdrawalCount={activeWithdrawalCount}
            transitionCount={stageCandidates.length}
          />

          {/* Conditional Views based on Tab & Role */}
          {currentRole === 'investor' && currentTab === 'finance' ? (
            <InvestorPortfolioView
              farms={farms}
              animals={displayedAnimals}
              financials={displayedFinances}
              milkings={displayedMilking}
              weights={displayedWeights}
              selectedFarmId={selectedFarmId}
            />
          ) : (
            <>
              {currentTab === 'animals' && (
                <AnimalList
                  animals={displayedAnimals}
                  lots={displayedLots}
                  farms={farms}
                  currentFarmId={selectedFarmId}
                  onSelectAnimal={animal => setSelectedAnimalForDetail(animal)}
                  onOpenCreate={() => setIsCreateAnimalOpen(true)}
                  onOpenBulk={() => setIsBulkOpen(true)}
                  onOpenScanner={() => setIsChipScannerOpen(true)}
                  onOpenVisualSearch={() => setIsVisualSearchOpen(true)}
                />
              )}

              {currentTab === 'reproduction' && (
                <ReproductionDashboard
                  animals={displayedAnimals}
                  reproEvents={displayedReproEvents}
                  onRefresh={loadDatabaseState}
                />
              )}

              {currentTab === 'milking' && (
                <MilkRecordsView
                  milkings={displayedMilking}
                  animals={displayedAnimals}
                  onRefresh={loadDatabaseState}
                />
              )}

              {currentTab === 'weights' && (
                <WeightRecordsView
                  weights={displayedWeights}
                  animals={displayedAnimals}
                  onRefresh={loadDatabaseState}
                />
              )}

              {currentTab === 'finance' && (
                <FinancialDashboard
                  financials={displayedFinances}
                  milkings={displayedMilking}
                  weights={displayedWeights}
                  onRefresh={loadDatabaseState}
                />
              )}

              {currentTab === 'health' && (
                <HealthRecordsView
                  healthRecords={displayedHealth}
                  animals={displayedAnimals}
                  onRefresh={loadDatabaseState}
                />
              )}

              {currentTab === 'zootechnician' && (
                <ZootechnicianDashboard
                  animals={displayedAnimals}
                  weights={displayedWeights}
                  milkings={displayedMilking}
                  lots={displayedLots}
                  onOpenStageConfig={() => setIsStageConfigOpen(true)}
                  onSelectAnimal={animal => setSelectedAnimalForDetail(animal)}
                />
              )}
            </>
          )}

        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Visible on mobile screens) */}
      <MobileTabBar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenCreateAnimal={() => setIsCreateAnimalOpen(true)}
        onOpenVisualSearch={() => setIsVisualSearchOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenBulk={() => setIsBulkOpen(true)}
        onOpenMobileTester={() => setIsMobileTesterOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenScanner={() => setIsChipScannerOpen(true)}
        alertCount={smartAlerts.length}
        counts={{
          animals: displayedAnimals.length,
          pregnant: pregnantCount,
          milking: milkingCount
        }}
      />

      {/* Global Modals */}
      {selectedAnimalForDetail && (
        <AnimalDetailModal
          animal={selectedAnimalForDetail}
          lot={displayedLots.find(l => l.id === selectedAnimalForDetail.lotId)}
          onClose={() => setSelectedAnimalForDetail(null)}
          onRefresh={loadDatabaseState}
        />
      )}

      {isCreateAnimalOpen && (
        <CreateAnimalModal
          lots={displayedLots}
          farms={farms}
          currentFarmId={selectedFarmId}
          onClose={() => setIsCreateAnimalOpen(false)}
          onCreated={() => {
            setIsCreateAnimalOpen(false);
            loadDatabaseState();
          }}
          onOpenScanner={cb => {
            setChipScanCallback(() => cb);
            setIsChipScannerOpen(true);
          }}
        />
      )}

      {isCreateFarmOpen && (
        <CreateFarmModal
          onClose={() => setIsCreateFarmOpen(false)}
          onCreated={newFarm => {
            setIsCreateFarmOpen(false);
            setSelectedFarmId(newFarm.id);
            loadDatabaseState();
          }}
        />
      )}

      {isVisualSearchOpen && (
        <VisualSearchModal
          animals={displayedAnimals}
          onClose={() => setIsVisualSearchOpen(false)}
          onSelectAnimal={animal => {
            setIsVisualSearchOpen(false);
            setSelectedAnimalForDetail(animal);
          }}
        />
      )}

      {isBulkOpen && (
        <React.Suspense fallback={null}>
          <BulkManagerModal
            lots={displayedLots}
            currentFarmId={selectedFarmId}
            onClose={() => setIsBulkOpen(false)}
            onImportCompleted={() => {
              setIsBulkOpen(false);
              loadDatabaseState();
            }}
          />
        </React.Suspense>
      )}

      {isAiOpen && (
        <React.Suspense fallback={null}>
          <CattleAiChatModal
            farmId={selectedFarmId}
            onClose={() => setIsAiOpen(false)}
            onNavigateToTab={(tab: string) => {
              setIsAiOpen(false);
              if (['animals', 'reproduction', 'milking', 'weights', 'finance', 'health'].includes(tab)) {
                setCurrentTab(tab as AppTab);
              }
            }}
          />
        </React.Suspense>
      )}

      {isBackupOpen && (
        <BackupRestoreModal
          onClose={() => setIsBackupOpen(false)}
          onRestored={() => {
            loadDatabaseState();
          }}
        />
      )}

      {/* Stage Transition Configuration Modal */}
      {isStageConfigOpen && (
        <StageTransitionModal
          farm={currentFarmObj}
          animals={displayedAnimals}
          onClose={() => setIsStageConfigOpen(false)}
          onUpdated={() => {
            loadDatabaseState();
          }}
        />
      )}

      {/* Smart Alerts Center Modal */}
      {isAlertsOpen && (
        <SmartAlertsModal
          alerts={smartAlerts}
          onClose={() => setIsAlertsOpen(false)}
          onNavigateTab={tab => {
            setIsAlertsOpen(false);
            if (['animals', 'reproduction', 'milking', 'weights', 'finance', 'health'].includes(tab)) {
              setCurrentTab(tab as AppTab);
            }
          }}
        />
      )}

      {/* Share and Feedback Modal (Roadmap Fase 3) */}
      {isShareOpen && (
        <ShareAndFeedbackModal
          farms={farms}
          animals={displayedAnimals}
          currentFarmId={selectedFarmId}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {/* Universal Chip Scanner Modal */}
      <UniversalChipScannerModal
        isOpen={isChipScannerOpen}
        onClose={() => {
          setIsChipScannerOpen(false);
          setChipScanCallback(null);
        }}
        animals={displayedAnimals}
        onSelectAnimal={animal => {
          setSelectedAnimalForDetail(animal);
          setIsChipScannerOpen(false);
          setChipScanCallback(null);
        }}
        onScannedCode={code => {
          if (chipScanCallback) {
            chipScanCallback(code);
            setIsChipScannerOpen(false);
            setChipScanCallback(null);
          }
        }}
      />

      {/* Pilot Welcome Onboarding (Roadmap Fase 2) */}
      {isWelcomeOpen && (
        <WelcomePilotModal
          onClose={() => setIsWelcomeOpen(false)}
          onStartDemo={handleStartDemo}
          onStartClean={handleStartClean}
        />
      )}

      {/* Auth & Account Security Modals */}
      {isAuthModalOpen && (
        <React.Suspense fallback={null}>
          <AuthModal onClose={() => setIsAuthModalOpen(false)} />
        </React.Suspense>
      )}

      {isAccountModalOpen && (
        <React.Suspense fallback={null}>
          <AccountSecurityModal onClose={() => setIsAccountModalOpen(false)} />
        </React.Suspense>
      )}

      {/* Mobile Tester Drawer */}
      {isMobileTesterOpen && (
        <React.Suspense fallback={null}>
          <MobileTesterDrawer
            isOpen={isMobileTesterOpen}
            onClose={() => setIsMobileTesterOpen(false)}
            activeDevice={activeDevice}
            onSelectDevice={dev => setActiveDevice(dev)}
            farms={farms}
            onRefreshData={loadDatabaseState}
          />
        </React.Suspense>
      )}
      </div>
    </FarmProvider>
  );

  return (
    <DeviceSimulatorFrame
      activeDevice={activeDevice}
      onExit={() => setActiveDevice('none')}
      onOpenQaDrawer={() => setIsMobileTesterOpen(true)}
    >
      {appContent}
    </DeviceSimulatorFrame>
  );
};

export default App;
