import React from 'react';
import { Smartphone } from 'lucide-react';
import type { SimulatedDevice } from './MobileTesterDrawer';

interface DeviceSimulatorFrameProps {
  activeDevice: SimulatedDevice;
  onExit: () => void;
  onOpenQaDrawer: () => void;
  children: React.ReactNode;
}

const DEVICE_LABELS: Record<Exclude<SimulatedDevice, 'none'>, string> = {
  iphone15: 'iPhone 15 Pro',
  galaxyS24: 'Samsung Galaxy S24',
  pixel8: 'Google Pixel 8',
  tablet: 'Tablet 10"'
};

const DEVICE_DIMENSIONS: Record<Exclude<SimulatedDevice, 'none'>, string> = {
  tablet: 'w-[768px] h-[920px]',
  iphone15: 'w-[393px] h-[820px]',
  galaxyS24: 'w-[380px] h-[800px]',
  pixel8: 'w-[412px] h-[840px]'
};

export const DeviceSimulatorFrame: React.FC<DeviceSimulatorFrameProps> = ({
  activeDevice,
  onExit,
  onOpenQaDrawer,
  children
}) => {
  if (activeDevice === 'none') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-900 py-6 px-3 flex flex-col items-center justify-center antialiased">
      <div className="mb-3 flex items-center space-x-3 text-white text-xs">
        <span className="font-bold flex items-center text-purple-300">
          <Smartphone className="w-4 h-4 mr-1 text-purple-400" />
          Simulador de Teléfono: {DEVICE_LABELS[activeDevice]}
        </span>
        <button
          onClick={onExit}
          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white font-semibold transition-colors"
        >
          Pantalla Completa
        </button>
        <button
          onClick={onOpenQaDrawer}
          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors"
        >
          Harness QA
        </button>
      </div>

      <div
        className={`relative bg-black rounded-[48px] p-3 shadow-2xl border-4 border-slate-700 overflow-hidden ${DEVICE_DIMENSIONS[activeDevice]}`}
      >
        {activeDevice === 'iphone15' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 pointer-events-none flex items-center justify-end pr-2.5 shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
          </div>
        )}

        {(activeDevice === 'galaxyS24' || activeDevice === 'pixel8') && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-50 pointer-events-none border border-slate-800" />
        )}

        <div className="w-full h-full rounded-[38px] overflow-y-auto bg-gray-50 flex flex-col relative overscroll-none scroll-smooth">
          {children}
        </div>
      </div>
    </div>
  );
};
