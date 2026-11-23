import React, { useState, useEffect, useRef } from 'react';
import { X, Radio, Camera, Cpu, Search, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import type { Animal } from '../../types/animal';

interface UniversalChipScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  onSelectAnimal?: (animal: Animal) => void;
  onScannedCode?: (code: string) => void;
  title?: string;
}

export const UniversalChipScannerModal: React.FC<UniversalChipScannerModalProps> = ({
  isOpen,
  onClose,
  animals,
  onSelectAnimal,
  onScannedCode,
  title = 'Lector Universal de Chips & Aretes'
}) => {
  const [activeTab, setActiveTab] = useState<'nfc' | 'camera' | 'manual'>('nfc');
  const [nfcSupported, setNfcSupported] = useState<boolean>(false);
  const [nfcReading, setNfcReading] = useState<boolean>(false);
  const [nfcError, setNfcError] = useState<string | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [matchedAnimal, setMatchedAnimal] = useState<Animal | null>(null);
  const [manualCode, setManualCode] = useState<string>('');

  // Audio beep feedback for field confirmation
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch {
      // AudioContext not allowed or muted
    }
  };

  // Check NFC capability
  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setNfcSupported(true);
    } else {
      setNfcSupported(false);
    }
  }, []);

  // Process detected code
  const handleCodeFound = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    playBeep();
    setScannedResult(cleanCode);

    // Look for matching animal by electronicId or earTagCode
    const found = animals.find(
      a =>
        (a.electronicId && a.electronicId.toLowerCase() === cleanCode.toLowerCase()) ||
        (a.earTagCode && a.earTagCode.toLowerCase() === cleanCode.toLowerCase())
    );

    setMatchedAnimal(found || null);

    if (onScannedCode) {
      onScannedCode(cleanCode);
    }
  };

  // Web NFC Scan Controller
  const startNfcScan = async () => {
    setNfcError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const NDEF = (window as any).NDEFReader;
      if (!NDEF) {
        setNfcError('NDEFReader no disponible');
        return;
      }
      const ndef = new NDEF();
      await ndef.scan();
      setNfcReading(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ndef.onreading = (event: any) => {
        let tagId = event.serialNumber || '';
        if (!tagId && event.message?.records?.length > 0) {
          const record = event.message.records[0];
          if (record.text) {
            tagId = record.text();
          }
        }
        if (tagId) {
          handleCodeFound(tagId);
        }
      };

      ndef.onreadingerror = () => {
        setNfcError('Error al leer el transpondedor RFID/NFC. Acerque el chip más firme.');
      };
    } catch (err: unknown) {
      setNfcReading(false);
      const e = err as Error;
      setNfcError(e.message || 'No se pudo iniciar el sensor NFC. Verifique los permisos del navegador.');
    }
  };

  // Camera Barcode / QR Scanner Controller
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
      return;
    }

    let isScanning = true;
    let scanInterval: NodeJS.Timeout | null = null;

    async function initCamera() {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);

          // Native BarcodeDetector if available in Chrome/Android
          if ('BarcodeDetector' in window) {
            // @ts-expect-error BarcodeDetector Web API
            const detector = new window.BarcodeDetector({
              formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'data_matrix']
            });

            scanInterval = setInterval(async () => {
              if (!isScanning || !videoRef.current || videoRef.current.readyState < 2) return;
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const raw = barcodes[0].rawValue;
                  if (raw && isScanning) {
                    isScanning = false;
                    handleCodeFound(raw);
                  }
                }
              } catch {
                // Ignore per-frame detection hiccups
              }
            }, 300);
          }
        }
      } catch (err: unknown) {
        const e = err as Error;
        setCameraError('No se pudo acceder a la cámara trasera: ' + (e.message || 'Permiso denegado'));
        setCameraActive(false);
      }
    }

    initCamera();

    return () => {
      isScanning = false;
      if (scanInterval) clearInterval(scanInterval);
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setMatchedAnimal(null);
      setNfcReading(false);
      setNfcError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-ranch-900 to-ranch-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Radio className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-lg">{title}</h3>
              <p className="text-xs text-gray-300">RFID ISO 11784/85 • NFC • Aretes con Código</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('nfc')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'nfc'
                ? 'bg-white text-ranch-800 shadow-xs border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>Chip RFID / NFC</span>
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-ranch-800 shadow-xs border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Cámara / QR</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-ranch-800 shadow-xs border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="w-4 h-4 text-purple-600" />
            <span>Bastón / Entrada</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* TAB 1: NFC / RFID */}
          {activeTab === 'nfc' && (
            <div className="text-center py-4 space-y-4">
              <div className="relative mx-auto w-32 h-32 rounded-full bg-emerald-50 border-4 border-emerald-500/20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-25"></div>
                <Radio className={`w-14 h-14 ${nfcReading ? 'text-emerald-600 animate-bounce' : 'text-gray-400'}`} />
              </div>

              <div>
                <h4 className="font-bold text-gray-900 text-base">
                  {nfcReading ? 'Buscando arete o transpondedor...' : 'Lector de Chip Activo'}
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Acerque la parte trasera de su teléfono al arete electrónico o bolo ruminal del animal.
                </p>
              </div>

              {nfcSupported ? (
                <div className="pt-2">
                  {!nfcReading ? (
                    <button
                      onClick={startNfcScan}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 mx-auto"
                    >
                      <Radio className="w-4 h-4" />
                      <span>Activar Sensor NFC de Campo</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-semibold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sensor listo: Toque el arete</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-left text-xs text-amber-800 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>NFC Web no detectado en este dispositivo</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    La lectura directa con el teléfono funciona en <strong>Google Chrome para Android</strong>. Si está usando una PC o iPhone, use la pestaña <strong>"Cámara / QR"</strong> o <strong>"Bastón / Entrada"</strong> para leer bastones Bluetooth Allflex/Gallagher.
                  </p>
                </div>
              )}

              {nfcError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-left">
                  {nfcError}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAMERA / QR / BARCODE */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Visual Viewfinder Reticle */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-28 border-2 border-emerald-400/80 rounded-2xl bg-emerald-500/10 flex items-center justify-center relative">
                      <div className="w-full h-0.5 bg-red-500/80 absolute animate-pulse"></div>
                      <span className="text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded font-mono mt-20">
                        Alinee código de arete
                      </span>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="p-4 text-center text-rose-200 text-xs max-w-xs">
                    <AlertCircle className="w-6 h-6 mx-auto mb-1 text-rose-400" />
                    {cameraError}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-500 text-center">
                Permite leer aretes visuales con códigos 1D (Code 128, Code 39) y 2D (QR o DataMatrix).
              </p>
            </div>
          )}

          {/* TAB 3: BASTÓN BLUETOOTH / MANUAL SIMULATOR */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl">
                <label className="block text-xs font-bold text-purple-900 mb-1.5">
                  Entrada de Bastón RFID o Teclado Emulado:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    placeholder="Ej. 982000412895671 o HLP-101"
                    className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCodeFound(manualCode);
                    }}
                  />
                  <button
                    onClick={() => handleCodeFound(manualCode)}
                    disabled={!manualCode.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Ingresar
                  </button>
                </div>
                <p className="text-[10px] text-purple-600 mt-1.5">
                  Los bastones de lectura (Allflex, Gallagher, Tru-Test) transmiten el código de 15 dígitos automáticamente al apuntar este campo.
                </p>
              </div>

              {/* Quick simulation buttons with real animals from the herd */}
              <div>
                <span className="text-xs font-bold text-gray-600 block mb-2">
                  Chips Rápidos en este Hato (Para Pruebas):
                </span>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {animals.slice(0, 6).map(animal => (
                    <button
                      key={animal.id}
                      onClick={() => handleCodeFound(animal.electronicId || animal.earTagCode)}
                      className="p-2 text-left bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-xl transition-all text-xs"
                    >
                      <div className="font-bold text-gray-800 truncate">{animal.name || animal.earTagCode}</div>
                      <div className="text-[10px] font-mono text-gray-400 truncate">
                        ID: {animal.electronicId || animal.earTagCode}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DETECTION RESULT CARD */}
          {scannedResult && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-300 p-4 rounded-2xl animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Código Leído con Éxito</span>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-lg">
                  {scannedResult}
                </span>
              </div>

              {matchedAnimal ? (
                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
                  <div>
                    <h5 className="font-black text-gray-900 text-sm">{matchedAnimal.name || 'Animal'} ({matchedAnimal.earTagCode})</h5>
                    <p className="text-[11px] text-gray-500">
                      Raza: {matchedAnimal.breedComposition?.[0]?.breedName || 'Bovino'} • Peso: {matchedAnimal.currentWeightKg || 'N/R'} kg
                    </p>
                  </div>
                  {onSelectAnimal && (
                    <button
                      onClick={() => {
                        onSelectAnimal(matchedAnimal);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-ranch-600 hover:bg-ranch-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Ver Ficha
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                  <span>Código no asignado a ningún animal activo.</span>
                  {onScannedCode && (
                    <button
                      onClick={() => {
                        onScannedCode(scannedResult);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg transition-colors"
                    >
                      Asignar Este Código
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 rounded-xl transition-colors"
          >
            Cerrar Lector
          </button>
        </div>
      </div>
    </div>
  );
};
