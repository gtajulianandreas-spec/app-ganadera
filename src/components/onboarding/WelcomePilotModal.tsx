import React, { useState } from 'react';
import { 
  Sparkles, 
  Smartphone, 
  ShieldCheck, 
  WifiOff, 
  CheckCircle2, 
  Play, 
  Layers, 
  X,
  Download
} from 'lucide-react';
import { pwaManager } from '../../pwa';

interface WelcomePilotModalProps {
  onClose: () => void;
  onStartDemo: () => void;
  onStartClean: () => void;
}

export const WelcomePilotModal: React.FC<WelcomePilotModalProps> = ({
  onClose,
  onStartDemo,
  onStartClean
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const handleFinish = (action: 'demo' | 'clean') => {
    if (dontShowAgain) {
      localStorage.setItem('has_seen_pilot_welcome', 'true');
    }
    if (action === 'demo') {
      onStartDemo();
    } else {
      onStartClean();
    }
    onClose();
  };

  const handleInstallClick = async () => {
    await pwaManager.triggerInstallPrompt();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-ranch-800 via-ranch-700 to-emerald-800 text-white p-6 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center text-3xl font-extrabold shadow-inner border border-white/20 mb-3">
            🐮
          </div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-[11px] font-extrabold border border-yellow-300/30 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Versión Piloto de Evaluación</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            ¡Bienvenido a APP GANADERA!
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto leading-relaxed">
            Plataforma profesional para la gestión técnica, reproductiva y financiera de tu hato.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs text-gray-700 flex-1">
          
          {/* Key Advantages for the Rancher */}
          <div className="space-y-2.5">
            <div className="flex items-start space-x-3 bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block text-xs">Tus Datos son 100% Privados</span>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  Tus vacas y finanzas se guardan en la memoria local de tu dispositivo. Ningún otro ganadero puede ver tu información.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-blue-50/70 border border-blue-200 p-3 rounded-2xl">
              <WifiOff className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block text-xs">Funciona en el Potrero Sin Internet</span>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  Puedes registrar pesajes, partos o litros de leche en zonas rurales sin cobertura. Los datos se guardan y sincronizan automáticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Decision: How to start */}
          <div>
            <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-2.5">
              ¿Cómo deseas iniciar tu prueba hoy?
            </h4>

            <div className="space-y-2.5">
              {/* Option A: Demo */}
              <button
                onClick={() => handleFinish('demo')}
                className="w-full p-4 rounded-2xl border-2 border-ranch-600 bg-ranch-50/40 hover:bg-ranch-50 transition-all text-left flex items-start justify-between group shadow-2xs"
              >
                <div className="space-y-1 pr-3">
                  <div className="font-bold text-ranch-900 text-xs sm:text-sm flex items-center space-x-1.5">
                    <Play className="w-4 h-4 text-ranch-700 fill-ranch-700" />
                    <span>Explorar Datos de Demostración (Recomendado)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Comienza con 12 vacas, registros de ordeño, partos programados y alertas para probar todas las funciones de inmediato.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-ranch-600 text-white shrink-0">
                  Explorar
                </span>
              </button>

              {/* Option B: Clean Farm */}
              <button
                onClick={() => handleFinish('clean')}
                className="w-full p-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-all text-left flex items-start justify-between text-gray-700"
              >
                <div className="space-y-0.5 pr-3">
                  <div className="font-bold text-gray-900 text-xs">
                    Comenzar con Mi Finca Limpia
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Si eres ganadero y deseas ingresar los aretes y datos reales de tus animales desde cero.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 shrink-0">
                  Finca Vacía
                </span>
              </button>
            </div>
          </div>

          {/* Don't show again toggle */}
          <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-[11px] text-gray-500">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-ranch-600 focus:ring-ranch-500"
              />
              <span>Recordar mi elección en este celular</span>
            </label>

            <button
              onClick={() => handleFinish('demo')}
              className="text-ranch-700 font-bold hover:underline"
            >
              Empezar ahora →
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
