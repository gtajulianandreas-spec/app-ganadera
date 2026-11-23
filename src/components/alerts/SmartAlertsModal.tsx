import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  PauseCircle, 
  Baby, 
  Flame, 
  Dna, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import type { Animal, Farm } from '../../types/animal';
import type { HealthRecord } from '../../types/production';
import type { ReproductionEvent } from '../../types/reproduction';
import type { StageTransitionCandidate } from '../../services/stageTransitionEngine';

export interface SmartAlertItem {
  id: string;
  category: 'withdrawal' | 'dry_off' | 'calving' | 'heat' | 'transition';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  subtitle: string;
  animalTag?: string;
  animalName?: string;
  dateOrDays?: string;
  targetTab?: string;
}

interface SmartAlertsModalProps {
  alerts: SmartAlertItem[];
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

export const SmartAlertsModal: React.FC<SmartAlertsModalProps> = ({
  alerts,
  onClose,
  onNavigateTab
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredAlerts = alerts.filter(a => {
    if (selectedCategory === 'all') return true;
    return a.category === selectedCategory;
  });

  const countCritical = alerts.filter(a => a.severity === 'critical').length;
  const countWarning = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-ranch-900 to-gray-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 relative">
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-extrabold flex items-center justify-center text-white border-2 border-gray-900">
                  {alerts.length}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Centro de Alertas Ganaderas</h2>
              <p className="text-xs text-gray-300">
                {countCritical > 0 
                  ? `🚨 ${countCritical} alertas críticas de inocuidad o manejo prioritario`
                  : 'Recordatorios automáticos en tiempo real calculados desde tu base local'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center space-x-1.5 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            Todas ({alerts.length})
          </button>

          <button
            onClick={() => setSelectedCategory('withdrawal')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center space-x-1 ${
              selectedCategory === 'withdrawal'
                ? 'bg-rose-600 text-white'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Retiros ({alerts.filter(a => a.category === 'withdrawal').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('dry_off')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center space-x-1 ${
              selectedCategory === 'dry_off'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>Secados ({alerts.filter(a => a.category === 'dry_off').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('calving')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center space-x-1 ${
              selectedCategory === 'calving'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            <span>Partos ({alerts.filter(a => a.category === 'calving').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('transition')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center space-x-1 ${
              selectedCategory === 'transition'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Etapas ({alerts.filter(a => a.category === 'transition').length})</span>
          </button>
        </div>

        {/* Alerts List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">¡Hato en Perfecto Estado!</p>
              <p className="text-xs text-gray-500 mt-1">
                No hay alertas activas de retiro farmacológico, secado urgente ni partos atrasados en este momento.
              </p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const isCritical = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    isCritical
                      ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                      : isWarning
                      ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 shrink-0">
                      {alert.category === 'withdrawal' && <ShieldAlert className="w-5 h-5 text-rose-600" />}
                      {alert.category === 'dry_off' && <PauseCircle className="w-5 h-5 text-amber-600" />}
                      {alert.category === 'calving' && <Baby className="w-5 h-5 text-blue-600" />}
                      {alert.category === 'heat' && <Flame className="w-5 h-5 text-rose-500" />}
                      {alert.category === 'transition' && <Dna className="w-5 h-5 text-emerald-600" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs sm:text-sm">{alert.title}</span>
                        {alert.animalTag && (
                          <span className="px-1.5 py-0.5 rounded bg-white text-gray-900 border border-gray-300 font-mono text-[10px] font-bold">
                            {alert.animalTag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{alert.subtitle}</p>
                      {alert.dateOrDays && (
                        <div className="text-[11px] font-semibold opacity-75 mt-1 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {alert.dateOrDays}
                        </div>
                      )}
                    </div>
                  </div>

                  {alert.targetTab && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateTab(alert.targetTab);
                      }}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border shadow-2xs hover:bg-gray-100 transition-colors shrink-0 flex items-center space-x-1"
                    >
                      <span>Ver</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>Sincronizado automáticamente sin requerir internet</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
