import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Radio, 
  Scale, 
  QrCode, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Layers, 
  Zap, 
  Sliders,
  Volume2,
  HardDrive,
  Sparkles
} from 'lucide-react';
import { db } from '../../db';
import { syncEngine } from '../../sync/engine';
import { pwaManager } from '../../pwa';
import { playBeep } from '../../utils/sound';
import type { Animal, Farm } from '../../types/animal';

export type SimulatedDevice = 'none' | 'iphone15' | 'galaxyS24' | 'pixel8' | 'tablet';

interface MobileTesterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeDevice: SimulatedDevice;
  onSelectDevice: (device: SimulatedDevice) => void;
  farms: Farm[];
  onRefreshData: () => void;
  onOpenCreateAnimalWithData?: (data: Partial<Animal>) => void;
}

export const MobileTesterDrawer: React.FC<MobileTesterDrawerProps> = ({
  isOpen,
  onClose,
  activeDevice,
  onSelectDevice,
  farms,
  onRefreshData,
  onOpenCreateAnimalWithData
}) => {
  const [activeTab, setActiveTab] = useState<'hardware' | 'network' | 'stress' | 'diagnostics'>('hardware');
  const [simulatedNetwork, setSimulatedNetwork] = useState<'online' | 'slow3g' | 'offline'>('online');
  const [storageEstimate, setStorageEstimate] = useState<{ usageMb: string; quotaMb: string } | null>(null);
  const [isInjectingData, setIsInjectingData] = useState(false);
  const [recentRfids, setRecentRfids] = useState<string[]>([]);
  const [scaleSimulation, setScaleSimulation] = useState<{ weight: number; isStable: boolean } | null>(null);



  // Inspect storage
  useEffect(() => {
    if (isOpen && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        const usageMb = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
        const quotaMb = ((estimate.quota || 0) / (1024 * 1024)).toFixed(0);
        setStorageEstimate({ usageMb, quotaMb });
      });
    }
  }, [isOpen]);

  // Simulate RFID scan
  const handleSimulateRfidScan = () => {
    playBeep(1800, 0.15);
    const mockRfid = '98200041289' + Math.floor(1000 + Math.random() * 9000);
    setRecentRfids(prev => [mockRfid, ...prev.slice(0, 4)]);

    // Copy to clipboard
    navigator.clipboard.writeText(mockRfid).catch(() => {});
  };

  // Simulate Bluetooth scale capture
  const handleSimulateScale = () => {
    setScaleSimulation({ weight: 420, isStable: false });
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const randomWeight = Math.round((450 + (Math.random() * 15 - 7.5)) * 10) / 10;
      setScaleSimulation({ weight: randomWeight, isStable: step >= 4 });

      if (step >= 4) {
        clearInterval(interval);
        playBeep(900, 0.2);
      }
    }, 300);
  };

  // Stress test: inject 25 randomized animals
  const handleInjectStressAnimals = async () => {
    setIsInjectingData(true);
    const targetFarm = farms[0]?.id || 'farm-1';
    const breeds = ['Girolando', 'Brahman Blanco', 'Black Angus', 'Jersey', 'Gyr Lechero', 'Simmental'];
    const newAnimals: Animal[] = [];

    for (let i = 1; i <= 25; i++) {
      const tagNum = Math.floor(500 + Math.random() * 4500);
      const randomBreed = breeds[Math.floor(Math.random() * breeds.length)];
      const isFemale = Math.random() > 0.35;
      const weight = Math.round(350 + Math.random() * 250);

      newAnimals.push({
        id: 'stress_anm_' + Date.now() + '_' + i,
        earTagCode: `TEST-${tagNum}`,
        electronicId: `982000999${tagNum}`,
        name: `Bovino QA-${i}`,
        species: 'bovine',
        gender: isFemale ? 'female' : 'male',
        currentStage: 'adult',
        purpose: isFemale ? 'milk' : 'beef',
        birthDate: '2022-04-10',
        currentWeightKg: weight,
        breedComposition: [{ breedId: 'stress', breedName: randomBreed, percentage: 100 }],
        farmId: targetFarm,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      });
    }

    await db.animals.bulkPut(newAnimals);
    setIsInjectingData(false);
    onRefreshData();
    playBeep(1400, 0.25);
  };

  // Export diagnostic report
  const handleExportDiagnostics = async () => {
    const animalCount = await db.animals.count();
    const milkCount = await db.milkingRecords.count();
    const weightCount = await db.weightRecords.count();
    const pendingSyncCount = await db.syncOutbox.where('status').equals('pending').count();

    const report = {
      appVersion: '1.0.0-MobilePWA',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio,
      storageEstimate,
      databaseMetrics: {
        totalFarms: farms.length,
        totalAnimals: animalCount,
        totalMilkings: milkCount,
        totalWeights: weightCount,
        pendingSyncOutbox: pendingSyncCount
      },
      pwaInstalled: pwaManager.getInstalledStatus(),
      serviceWorkerActive: 'serviceWorker' in navigator
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diagnostico_Movil_Ganadero_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">Harness de Pruebas Móviles & QA</h2>
              <p className="text-[11px] text-purple-200">Simulación para lanzamiento en Play Store / App Store</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emulated Device Selection */}
        <div className="p-4 bg-purple-50/70 border-b border-purple-100">
          <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-2">
            Marco de Visualización (Device Mockup):
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { id: 'none', label: 'Pantalla Completa' },
              { id: 'iphone15', label: 'iPhone 15 Pro' },
              { id: 'galaxyS24', label: 'Galaxy S24' },
              { id: 'pixel8', label: 'Pixel 8' },
              { id: 'tablet', label: 'Tablet 10"' }
            ].map(d => (
              <button
                key={d.id}
                onClick={() => onSelectDevice(d.id as SimulatedDevice)}
                className={`py-1.5 px-2 rounded-xl text-center font-semibold border transition-all text-[11px] ${
                  activeDevice === d.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200 px-4 text-xs font-bold text-gray-500 overflow-x-auto">
          {[
            { id: 'hardware', label: 'Hardware Campo', icon: Radio },
            { id: 'network', label: 'Señal Rural', icon: Wifi },
            { id: 'stress', label: 'Carga Masiva', icon: Layers },
            { id: 'diagnostics', label: 'Diagnóstico', icon: HardDrive }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-3 px-2 flex items-center space-x-1.5 border-b-2 transition-all shrink-0 ${
                  isActive ? 'border-purple-600 text-purple-700 font-extrabold' : 'border-transparent hover:text-gray-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          
          {/* TAB 1: HARDWARE FIELD SIMULATOR */}
          {activeTab === 'hardware' && (
            <div className="space-y-4">
              {/* RFID Scanner Simulator */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-gray-900">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    <span>Lector RFID / Chip ISO 11784</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    Baston / Antena
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Simula la aproximación de un bastón de lectura RFID (Allflex / Gallagher) al arete de una vaca en la manga.
                </p>

                <button
                  onClick={handleSimulateRfidScan}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Simular Pitido y Lectura de Arete</span>
                </button>

                {recentRfids.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 space-y-1">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Últimos códigos capturados:</span>
                    {recentRfids.map((code, idx) => (
                      <div key={idx} className="flex items-center justify-between font-mono bg-white p-1.5 rounded-lg border border-gray-200 text-[11px]">
                        <span className="font-bold text-gray-800">{code}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">Copiado al portapapeles</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bluetooth Scale Simulator */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-gray-900">
                    <Scale className="w-4 h-4 text-amber-600" />
                    <span>Báscula Ganadera Bluetooth</span>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                    Tru-Test / Gallagher
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Simula la conexión BLE serial con barras de pesaje bajo el brete y estabilización de peso con animal en movimiento.
                </p>

                <button
                  onClick={handleSimulateScale}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors"
                >
                  <Scale className="w-4 h-4" />
                  <span>Capturar Peso Estable</span>
                </button>

                {scaleSimulation && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    scaleSimulation.isStable ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase block">
                        {scaleSimulation.isStable ? '✓ Peso Bloqueado' : 'Estabilizando animal...'}
                      </span>
                      <span className="text-xl font-black font-mono">{scaleSimulation.weight} kg</span>
                    </div>
                    <span className="text-[11px] font-bold">
                      {scaleSimulation.isStable ? 'Estable (OK)' : 'Fluctuando'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NETWORK & SIGNAL SIMULATION */}
          {activeTab === 'network' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center space-x-2 font-bold text-gray-900">
                  <Wifi className="w-4 h-4 text-blue-600" />
                  <span>Simulador de Conectividad en Potreros</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Prueba la resiliencia offline de la aplicación simulando pérdida de cobertura celular rural sin desconectar tu conexión física.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSimulatedNetwork('online');
                      window.dispatchEvent(new Event('online'));
                    }}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-colors ${
                      simulatedNetwork === 'online' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Wifi className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div>4G / WiFi Óptimo</div>
                        <div className="text-[10px] text-gray-400 font-normal">Sincronización instantánea en segundo plano</div>
                      </div>
                    </div>
                    {simulatedNetwork === 'online' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => {
                      setSimulatedNetwork('offline');
                      window.dispatchEvent(new Event('offline'));
                    }}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-colors ${
                      simulatedNetwork === 'offline' ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <WifiOff className="w-4 h-4 text-amber-600" />
                      <div>
                        <div>Sin Señal / Potrero Remoto (Offline Total)</div>
                        <div className="text-[10px] text-gray-400 font-normal">Todas las operaciones van a la cola outbox local</div>
                      </div>
                    </div>
                    {simulatedNetwork === 'offline' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STRESS TESTING */}
          {activeTab === 'stress' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center space-x-2 font-bold text-gray-900">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Pruebas de Carga y Rendimiento Móvil</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Genera conjuntos de datos grandes para evaluar la suavidad del desplazamiento (*60 FPS scroll*), renderizado de fotos y memoria en teléfonos de gama de entrada.
                </p>

                <button
                  onClick={handleInjectStressAnimals}
                  disabled={isInjectingData}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isInjectingData ? 'Inyectando cabezas de ganado...' : 'Generar +25 Animales de Prueba'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">Almacenamiento Local IndexedDB</span>
                  <HardDrive className="w-4 h-4 text-gray-500" />
                </div>
                {storageEstimate ? (
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block font-medium">Uso Actual</span>
                      <span className="font-extrabold text-gray-800 text-sm">{storageEstimate.usageMb} MB</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block font-medium">Cuota Disponible</span>
                      <span className="font-extrabold text-gray-800 text-sm">{storageEstimate.quotaMb} MB</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-[11px]">Calculando almacenamiento...</p>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <span className="font-bold text-gray-900 block">Capacidades PWA & App Store:</span>
                <div className="space-y-1 text-[11px] text-gray-600">
                  <div className="flex justify-between">
                    <span>Service Worker Activo:</span>
                    <span className="font-bold text-emerald-600">{'serviceWorker' in navigator ? '✓ Soportado' : '✕ No soportado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modo Standalone (PWA):</span>
                    <span className="font-bold text-gray-900">{pwaManager.getInstalledStatus() ? 'Instalada' : 'Navegador Web'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pantalla Táctil:</span>
                    <span className="font-bold text-gray-900">{'ontouchstart' in window ? 'Detectada' : 'Mouse / Desktop'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExportDiagnostics}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Informe de QA (.json)</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-[11px] text-gray-500">
          <span>HATERRA QA Suite v1.0</span>
          <button onClick={onClose} className="font-bold text-purple-700 hover:underline">
            Cerrar Panel
          </button>
        </div>

      </div>
    </div>
  );
};
