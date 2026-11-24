import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { SmartAlertsModal, type SmartAlertItem } from './components/alerts/SmartAlertsModal';
import { ShareAndFeedbackModal } from './components/share/ShareAndFeedbackModal';
import { WelcomePilotModal } from './components/onboarding/WelcomePilotModal';
import { UniversalChipScannerModal } from './components/scanner/UniversalChipScannerModal';
import { ZootechnicianDashboard } from './components/zootechnician/ZootechnicianDashboard';

import { db } from './db';
import { seedDemoDataIfEmpty } from './db/seed';
import { syncEngine } from './sync/engine';
import { StageTransitionEngine } from './services/stageTransitionEngine';

import type { Animal, Lot, Pasture, Farm } from './types/animal';
import type { ReproductionEvent } from './types/reproduction';
import type { MilkingRecord, WeightRecord, HealthRecord } from './types/production';
import type { FinancialRecord } from './types/finance';
import type { UserRole } from './types/userRole';
import { FarmProvider, type FarmContextValue } from './context/FarmContext';
import { Smartphone } from 'lucide-react';

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

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppTab>('animals');
  const [isLoading, setIsLoading] = useState(true);

  // User Profile / Role (Zootecnista, Inversionista, Admin, etc.)
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  // Farms and active selection
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('farm-1');

  // Entities
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [pastures, setPastures] = useState<Pasture[]>([]);
  const [reproEvents, setReproEvents] = useState<ReproductionEvent[]>([]);
  const [milkingRecords, setMilkingRecords] = useState<MilkingRecord[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);

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
  const [chipScanCallback, setChipScanCallback] = useState<((code: string) => void) | null>(null);
  const [activeDevice, setActiveDevice] = useState<SimulatedDevice>('none');

  // Load all DB state
  const loadDatabaseState = useCallback(async () => {
    try {
      const [
        fetchedFarms,
        fetchedAnimals,
        fetchedLots,
        fetchedPastures,
        fetchedRepro,
        fetchedMilking,
        fetchedWeights,
        fetchedHealth,
        fetchedFinances
      ] = await Promise.all([
        db.farms.toArray(),
        db.animals.toArray(),
        db.lots.toArray(),
        db.pastures.toArray(),
        db.reproductionEvents.reverse().toArray(),
        db.milkingRecords.reverse().toArray(),
        db.weightRecords.reverse().toArray(),
        db.healthRecords.reverse().toArray(),
        db.financialRecords.reverse().toArray()
      ]);

      setFarms(fetchedFarms);
      setAnimals(fetchedAnimals);
      setLots(fetchedLots);
      setPastures(fetchedPastures);
      setReproEvents(fetchedRepro);
      setMilkingRecords(fetchedMilking);
      setWeightRecords(fetchedWeights);
      setHealthRecords(fetchedHealth);
      setFinancialRecords(fetchedFinances);

      // If selectedFarmId is not found and not 'all', default to first farm
      if (selectedFarmId !== 'all' && fetchedFarms.length > 0 && !fetchedFarms.some(f => f.id === selectedFarmId)) {
        setSelectedFarmId(fetchedFarms[0].id);
      }
    } catch (err) {
      console.error('Failed to load local database state:', err);
    }
  }, [selectedFarmId]);

  // Initialize DB and Seed Data
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await seedDemoDataIfEmpty();
      await loadDatabaseState();
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
  }, [loadDatabaseState]);

  // Pre-warm lazy modules in background when browser is idle to ensure offline pasture readiness
  useEffect(() => {
    const prewarm = () => {
      import('./components/bulk/BulkManagerModal');
      import('./components/testing/MobileTesterDrawer');
      import('./components/ai/CattleAiChatModal');
    };
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(prewarm);
      } else {
        setTimeout(prewarm, 2000);
      }
    }
  }, []);

  // Filter entities according to active farm selection ('all' vs specific farm)
  const isGlobal = selectedFarmId === 'all';
  const animalMap = useMemo(() => new Map(animals.map(a => [a.id, a])), [animals]);

  const displayedAnimals = useMemo(() => {
    if (isGlobal) return animals;
    return animals.filter(a => a.farmId === selectedFarmId);
  }, [isGlobal, animals, selectedFarmId]);

  const displayedLots = useMemo(() => {
    if (isGlobal) return lots;
    return lots.filter(l => l.farmId === selectedFarmId);
  }, [isGlobal, lots, selectedFarmId]);

  const displayedPastures = useMemo(() => {
    if (isGlobal) return pastures;
    return pastures.filter(p => p.farmId === selectedFarmId);
  }, [isGlobal, pastures, selectedFarmId]);

  const displayedReproEvents = useMemo(() => {
    if (isGlobal) return reproEvents;
    return reproEvents.filter(r => (r.farmId ? r.farmId === selectedFarmId : animalMap.get(r.animalId)?.farmId === selectedFarmId));
  }, [isGlobal, reproEvents, animalMap, selectedFarmId]);

  const displayedMilking = useMemo(() => {
    if (isGlobal) return milkingRecords;
    return milkingRecords.filter(m => (m.farmId ? m.farmId === selectedFarmId : animalMap.get(m.animalId)?.farmId === selectedFarmId));
  }, [isGlobal, milkingRecords, animalMap, selectedFarmId]);

  const displayedWeights = useMemo(() => {
    if (isGlobal) return weightRecords;
    return weightRecords.filter(w => (w.farmId ? w.farmId === selectedFarmId : animalMap.get(w.animalId)?.farmId === selectedFarmId));
  }, [isGlobal, weightRecords, animalMap, selectedFarmId]);

  const displayedHealth = useMemo(() => {
    if (isGlobal) return healthRecords;
    return healthRecords.filter(h => (h.farmId ? h.farmId === selectedFarmId : animalMap.get(h.animalId)?.farmId === selectedFarmId));
  }, [isGlobal, healthRecords, animalMap, selectedFarmId]);

  const displayedFinances = useMemo(() => {
    if (isGlobal) return financialRecords;
    return financialRecords.filter(f => f.farmId === selectedFarmId);
  }, [isGlobal, financialRecords, selectedFarmId]);

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
  const todayStr = new Date().toISOString().split('T')[0];
  const next15Days = new Date();
  next15Days.setDate(next15Days.getDate() + 15);
  const next15DaysStr = next15Days.toISOString().split('T')[0];

  const smartAlerts: SmartAlertItem[] = useMemo(() => {
    const list: SmartAlertItem[] = [];

    // 1. Health / Withdrawal alerts
    for (const h of displayedHealth) {
      const a = animalMap.get(h.animalId);
      if (h.safeMilkDate && h.safeMilkDate >= todayStr) {
        list.push({
          id: 'alt_milk_' + h.id,
          category: 'withdrawal',
          severity: 'critical',
          title: 'Leche en Retiro Farmacológico',
          subtitle: `Tratamiento con ${h.treatmentName}. No enviar al tanque comunal.`,
          animalTag: a?.earTagCode || h.animalId,
          animalName: a?.name,
          dateOrDays: `Libre de fármaco el: ${h.safeMilkDate}`,
          targetTab: 'health'
        });
      }
      if (h.safeMeatDate && h.safeMeatDate >= todayStr) {
        list.push({
          id: 'alt_meat_' + h.id,
          category: 'withdrawal',
          severity: 'critical',
          title: 'Restricción de Faena para Carne',
          subtitle: `Tratamiento con ${h.treatmentName}. Tiempo de carencia activo para beneficio.`,
          animalTag: a?.earTagCode || h.animalId,
          animalName: a?.name,
          dateOrDays: `Apta el: ${h.safeMeatDate}`,
          targetTab: 'health'
        });
      }
    }

    // 2. Dry-off alerts
    for (const r of displayedReproEvents) {
      if (r.pregnancyResult === 'pregnant' && r.mandatoryDryOffDate && r.mandatoryDryOffDate <= next15DaysStr) {
        const a = animalMap.get(r.animalId);
        const isOverdue = r.mandatoryDryOffDate < todayStr;
        list.push({
          id: 'alt_dry_' + r.id,
          category: 'dry_off',
          severity: isOverdue ? 'critical' : 'warning',
          title: isOverdue ? '¡Secado de Vaca Vencido!' : 'Secado Obligatorio Próximo',
          subtitle: `Vaca preñada debe cesar ordeño y recibir terapia intramamaria (60 días preparto).`,
          animalTag: a?.earTagCode || r.animalId,
          animalName: a?.name,
          dateOrDays: `Fecha límite: ${r.mandatoryDryOffDate}`,
          targetTab: 'reproduction'
        });
      }
    }

    // 3. Calving alerts
    for (const r of displayedReproEvents) {
      if (r.pregnancyResult === 'pregnant' && r.projectedCalvingDate && r.projectedCalvingDate <= next15DaysStr) {
        const a = animalMap.get(r.animalId);
        list.push({
          id: 'alt_calv_' + r.id,
          category: 'calving',
          severity: 'warning',
          title: 'Parto Inminente (< 15 días)',
          subtitle: `Trasladar a potrero de maternidad para asistencia 24h y suplementación preparto.`,
          animalTag: a?.earTagCode || r.animalId,
          animalName: a?.name,
          dateOrDays: `Parto proyectado: ${r.projectedCalvingDate}`,
          targetTab: 'reproduction'
        });
      }
    }

    // 4. Life stage transitions
    for (const c of stageCandidates) {
      list.push({
        id: 'alt_trans_' + c.animal.id,
        category: 'transition',
        severity: 'info',
        title: 'Transición de Etapa Lista',
        subtitle: c.reason,
        animalTag: c.animal.earTagCode,
        animalName: c.animal.name,
        dateOrDays: `${c.ageMonths} meses cumplidos`,
        targetTab: 'animals'
      });
    }

    return list;
  }, [displayedHealth, displayedReproEvents, stageCandidates, animalMap, todayStr, next15DaysStr]);

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
          lot={lots.find(l => l.id === selectedAnimalForDetail.lotId)}
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

  // If a simulated mobile phone frame is active on desktop, wrap inside mockup
  if (activeDevice !== 'none') {
    return (
      <div className="min-h-screen bg-slate-900 py-6 px-3 flex flex-col items-center justify-center antialiased">
        {/* Device Controls Bar */}
        <div className="mb-3 flex items-center space-x-3 text-white text-xs">
          <span className="font-bold flex items-center text-purple-300">
            <Smartphone className="w-4 h-4 mr-1 text-purple-400" />
            Simulador de Teléfono: {activeDevice === 'iphone15' ? 'iPhone 15 Pro' : activeDevice === 'galaxyS24' ? 'Samsung Galaxy S24' : activeDevice === 'pixel8' ? 'Google Pixel 8' : 'Tablet 10"'}
          </span>
          <button
            onClick={() => setActiveDevice('none')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white font-semibold transition-colors"
          >
            Pantalla Completa
          </button>
          <button
            onClick={() => setIsMobileTesterOpen(true)}
            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors"
          >
            Harness QA
          </button>
        </div>

        {/* Physical Phone Skin Container */}
        <div className={`relative bg-black rounded-[48px] p-3 shadow-2xl border-4 border-slate-700 overflow-hidden ${
          activeDevice === 'tablet' 
            ? 'w-[768px] h-[920px]' 
            : activeDevice === 'iphone15' 
            ? 'w-[393px] h-[820px]' 
            : activeDevice === 'galaxyS24' 
            ? 'w-[380px] h-[800px]' 
            : 'w-[412px] h-[840px]'
        }`}>
          {/* Dynamic Island for iPhone */}
          {activeDevice === 'iphone15' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 pointer-events-none flex items-center justify-end pr-2.5 shadow-md">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
            </div>
          )}

          {/* Android Punch Hole Camera */}
          {(activeDevice === 'galaxyS24' || activeDevice === 'pixel8') && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-50 pointer-events-none border border-slate-800" />
          )}

          {/* Inner Phone Viewport */}
          <div className="w-full h-full rounded-[38px] overflow-y-auto bg-gray-50 flex flex-col relative overscroll-none scroll-smooth">
            {appContent}
          </div>
        </div>
      </div>
    );
  }

  // Full Screen Responsive View (Default for actual phones or widescreen desktop)
  return appContent;
};

export default App;
