import React, { useState, useMemo } from 'react';
import { 
  GitBranch, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Clock, 
  Baby, 
  BellRing,
  HelpCircle,
  PauseCircle,
  ShieldCheck,
  Syringe,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import type { ReproductionEvent } from '../../types/reproduction';
import type { Animal } from '../../types/animal';
import { ReproductionEngine } from '../../services/reproductionEngine';
import { db } from '../../db';
import { saveEntityWithOutbox } from '../../db/mutations';
import { generateId } from '../../utils/id';

interface ReproductionDashboardProps {
  animals: Animal[];
  reproEvents: ReproductionEvent[];
  onRefresh: () => void;
}

export const ReproductionDashboard: React.FC<ReproductionDashboardProps> = ({
  animals,
  reproEvents,
  onRefresh
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'gestation' | 'dryoff'>('gestation');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDryOffModal, setShowDryOffModal] = useState(false);

  // General event form
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(animals[0]?.id || '');
  const [eventType, setEventType] = useState<ReproductionEvent['eventType']>('insemination');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [sireCode, setSireCode] = useState('STRAW-HOL-990');
  const [pregnancyResult, setPregnancyResult] = useState<'pregnant' | 'open'>('pregnant');
  const [technician, setTechnician] = useState('Dr. Ricardo Rivas');

  // Specialized Dry-off form
  const [dryOffCowId, setDryOffCowId] = useState<string>(animals[0]?.id || '');
  const [dryOffDate, setDryOffDate] = useState(new Date().toISOString().split('T')[0]);
  const [dryOffProduct, setDryOffProduct] = useState('Cefalonio Intramamario (Cefa-Dry) + Sellador Bismuto');
  const [dryOffNotes, setDryOffNotes] = useState('Secado brusco con aplicación de tubo en los 4 cuartos');

  const animalMap = useMemo(() => new Map(animals.map(a => [a.id, a])), [animals]);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const next45DaysStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().split('T')[0];
  }, []);

  // 1. Pregnant cows list
  const pregnantEvents = useMemo(() => {
    return reproEvents.filter(r => r.pregnancyResult === 'pregnant' && r.projectedCalvingDate);
  }, [reproEvents]);

  // 2. Upcoming calvings in next 45 days
  const upcomingCalvings = useMemo(() => {
    return pregnantEvents.filter(r => 
      r.projectedCalvingDate && r.projectedCalvingDate >= todayStr && r.projectedCalvingDate <= next45DaysStr
    ).sort((a, b) => (a.projectedCalvingDate || '').localeCompare(b.projectedCalvingDate || ''));
  }, [pregnantEvents, todayStr, next45DaysStr]);

  // 3. Dry-Off Alerts (due within 30 days or already due)
  const dryOffAlerts = useMemo(() => {
    return pregnantEvents.filter(r => 
      r.mandatoryDryOffDate && r.mandatoryDryOffDate <= next45DaysStr
    );
  }, [pregnantEvents, next45DaysStr]);

  // 4. Dedicated Dry-Off events recorded
  const dryOffEvents = useMemo(() => {
    return reproEvents.filter(r => r.eventType === 'dry_off');
  }, [reproEvents]);

  // 5. Recurrent Heat Monitor (inseminated 18 to 24 days ago)
  const heatWatchList = useMemo(() => {
    const recentInseminations = reproEvents.filter(r => r.eventType === 'insemination');
    return recentInseminations.map(r => {
      const { inWindow, daysAgo } = ReproductionEngine.isHeatAlertWindow(r.date);
      return { event: r, inWindow, daysAgo, animal: animalMap.get(r.animalId) };
    }).filter(item => item.inWindow);
  }, [reproEvents, animalMap]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const animal = animalMap.get(selectedAnimalId);

    let projectedCalvingDate: string | undefined;
    let mandatoryDryOffDate: string | undefined;

    if (eventType === 'insemination') {
      const dates = ReproductionEngine.calculateDates(
        eventDate, 
        animal?.species || 'bovine', 
        animal?.breedComposition
      );
      projectedCalvingDate = dates.projectedCalvingDate;
      mandatoryDryOffDate = dates.mandatoryDryOffDate;
    }

    const newEvent: ReproductionEvent = {
      id: generateId('rep'),
      farmId: animal?.farmId,
      animalId: selectedAnimalId,
      eventType,
      date: eventDate,
      sireId: sireCode || undefined,
      technicianName: technician || undefined,
      pregnancyResult: eventType === 'pregnancy_check' ? pregnancyResult : undefined,
      projectedCalvingDate,
      mandatoryDryOffDate,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveEntityWithOutbox(db.reproductionEvents, 'reproduction', 'create', newEvent);

    setShowEventModal(false);
    onRefresh();
  };

  const handleSaveDryOff = async (e: React.FormEvent) => {
    e.preventDefault();
    const dryAnimal = animalMap.get(dryOffCowId);

    const newEvent: ReproductionEvent = {
      id: generateId('dry'),
      farmId: dryAnimal?.farmId,
      animalId: dryOffCowId,
      eventType: 'dry_off',
      date: dryOffDate,
      dryOffTherapyProduct: dryOffProduct.trim() || undefined,
      dryOffStatus: 'active_drying',
      notes: dryOffNotes.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveEntityWithOutbox(db.reproductionEvents, 'reproduction', 'create', newEvent);

    setShowDryOffModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <span>Control Reproductivo Avanzado</span>
            <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              {pregnantEvents.length} {pregnantEvents.length === 1 ? 'Gestación Activa' : 'Gestaciones Activas'}
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Garantiza la regeneración mamaria con secado a 60 días, alerta de celos cíclicos (18-24 d) y proyecciones por raza
          </p>
        </div>

        <button
          onClick={() => setShowEventModal(true)}
          className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Registrar Evento Reproductivo
        </button>
      </div>

      {/* Sub-navigation Tabs: Gestaciones vs Módulo Especial de Secado */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveSubTab('gestation')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeSubTab === 'gestation'
              ? 'bg-ranch-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Gestaciones, Servicios y Partos ({pregnantEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dryoff')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeSubTab === 'dryoff'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <PauseCircle className="w-4 h-4" />
          <span>Módulo de Secado & Terapia Mamaria ({dryOffAlerts.length})</span>
        </button>
      </div>

      {activeSubTab === 'gestation' ? (
        <>
          {/* Tri-Dashboard Alert Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Secado Obligatorio */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mr-1.5 shrink-0" />
                Alerta de Secado (60d)
              </span>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 tabular-nums">
                {dryOffAlerts.length} {dryOffAlerts.length === 1 ? 'vaca' : 'vacas'}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Vacas que deben dejar de ordeñarse inmediatamente para garantizar descanso mamario y calostro óptimo.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
            {dryOffAlerts.slice(0, 3).map(r => {
              const a = animalMap.get(r.animalId);
              return (
                <div key={r.id} className="flex items-center justify-between text-xs bg-amber-50/70 p-2 rounded-xl">
                  <span className="font-bold text-gray-800">{a?.earTagCode} ({a?.name || 'Vaca'})</span>
                  <span className="font-semibold text-amber-800 tabular-nums">Fecha: {r.mandatoryDryOffDate}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Partos Inminentes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center">
                <Baby className="w-3.5 h-3.5 text-blue-600 mr-1.5 shrink-0" />
                Partos Próximos (45d)
              </span>
              <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 tabular-nums">
                {upcomingCalvings.length} {upcomingCalvings.length === 1 ? 'parto' : 'partos'}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Trasladar al potrero de maternidad para vigilancia 24h, agua limpia y sales preparto.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
            {upcomingCalvings.slice(0, 3).map(r => {
              const a = animalMap.get(r.animalId);
              return (
                <div key={r.id} className="flex items-center justify-between text-xs bg-blue-50/70 p-2 rounded-xl">
                  <span className="font-bold text-gray-800">{a?.earTagCode} ({a?.name || 'Vaca'})</span>
                  <span className="font-semibold text-blue-800 tabular-nums">{r.projectedCalvingDate}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Semáforo de Celos Recurrentes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center">
                <BellRing className="w-3.5 h-3.5 text-rose-600 mr-1.5 shrink-0" />
                Celo Cíclico (18-24d)
              </span>
              <span className="text-[11px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 tabular-nums">
                {heatWatchList.length} en ventana
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Monitorear comportamiento matutino/vespertino para detectar celos repetidos o confirmar no-retorno.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
            {heatWatchList.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No hay vacas en ventana de celo hoy.</p>
            ) : (
              heatWatchList.map(item => (
                <div key={item.event.id} className="flex items-center justify-between text-xs bg-rose-50/60 p-2 rounded-xl">
                  <span className="font-bold text-gray-800">{item.animal?.earTagCode}</span>
                  <span className="font-bold text-rose-700">Día {item.daysAgo} post-servicio</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Detailed Gestation Registry Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Registro Integral de Gestaciones y Partos Proyectados</h2>
          <span className="text-xs text-gray-500 font-medium">Fórmula gestación: Bos taurus (283d) • Bos indicus (292d)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 font-semibold text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Hembra / Arete</th>
                <th className="py-3 px-4">Fecha Servicio</th>
                <th className="py-3 px-4">Toro / Pajilla</th>
                <th className="py-3 px-4">Secado Obligatorio</th>
                <th className="py-3 px-4">Parto Estimado</th>
                <th className="py-3 px-4">Diagnóstico</th>
                <th className="py-3 px-4">Inseminador / Vet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pregnantEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 font-medium">
                    No hay gestaciones confirmadas registradas.
                  </td>
                </tr>
              ) : (
                pregnantEvents.map(r => {
                  const a = animalMap.get(r.animalId);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {a?.earTagCode}
                        <span className="block text-gray-500 font-normal text-[11px]">{a?.name || 'Sin nombre'}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-700">{r.date}</td>
                      <td className="py-3 px-4 text-gray-600">{r.sireId || 'Toro del hato'}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {r.mandatoryDryOffDate || 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {r.projectedCalvingDate}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          PREÑADA
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{r.technicianName || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : (
        /* Dedicated Dry-Off Subview */
        <div className="space-y-6 animate-in fade-in">
          {/* Dry Off Header & Actions */}
          <div className="bg-amber-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-800 text-amber-200 text-xs font-bold">
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Protocolo de Vaca Seca (60 Días de Descanso Mamario)</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">
                Módulo Especial de Secado y Terapia Mamaria
              </h2>
              <p className="text-xs text-amber-200 leading-relaxed">
                El período seco es vital para la regeneración del tejido glandular de la ubre, la síntesis de inmunoglobulinas 
                para el calostro y la prevención de mastitis en la siguiente lactancia.
              </p>
            </div>

            <button
              onClick={() => setShowDryOffModal(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Registrar Secado & Terapia de Ubre
            </button>
          </div>

          {/* Cards Grid: Dry Off Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Vacas Próximas a Secar</div>
              <div className="text-2xl font-black text-amber-900 mt-1">{dryOffAlerts.length}</div>
              <p className="text-[11px] text-gray-500 mt-0.5">En los próximos 45 días o fecha vencida</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">En Secado Activo</div>
              <div className="text-2xl font-black text-gray-900 mt-1">{dryOffEvents.length}</div>
              <p className="text-[11px] text-gray-500 mt-0.5">Vacas descansando en potrero de maternidad</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Con Terapia Mamaria</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {dryOffEvents.filter(d => d.dryOffTherapyProduct).length}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Protegidas con antibiótico o sellador</p>
            </div>
          </div>

          {/* Section 1: Vacas que deben secarse pronto */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Vacas por Secar Urgente o Próximamente ({dryOffAlerts.length})
                </h3>
              </div>
              <span className="text-[11px] text-amber-800 font-semibold">Suspender ordeño a los 220 días de preñez</span>
            </div>

            <div className="divide-y divide-gray-100">
              {dryOffAlerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  No hay vacas pendientes de secado en esta finca en este momento.
                </div>
              ) : (
                dryOffAlerts.map(r => {
                  const cow = animalMap.get(r.animalId);
                  return (
                    <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900 text-sm">{cow?.earTagCode}</span>
                          <span className="text-xs text-gray-500 font-medium">({cow?.name || 'Vaca'})</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                            Fecha Límite: {r.mandatoryDryOffDate}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Parto proyectado: <span className="font-semibold text-gray-700">{r.projectedCalvingDate}</span> • 
                          Pajilla/Toro: <span className="font-semibold text-gray-700">{r.sireId || 'Hato'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setDryOffCowId(r.animalId);
                          setShowDryOffModal(true);
                        }}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs self-start sm:self-auto transition-colors"
                      >
                        <Syringe className="w-3.5 h-3.5 mr-1" />
                        Registrar Secado Ahora
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 2: Historial de Vacas en Secado */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                Vacas en Secado Registradas ({dryOffEvents.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Vaca / Arete</th>
                    <th className="py-2.5 px-4">Fecha Secado</th>
                    <th className="py-2.5 px-4">Terapia Mamaria Aplicada</th>
                    <th className="py-2.5 px-4">Estado</th>
                    <th className="py-2.5 px-4">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dryOffEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No hay eventos de secado formalmente guardados aún.
                      </td>
                    </tr>
                  ) : (
                    dryOffEvents.map(d => {
                      const cow = animalMap.get(d.animalId);
                      return (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-bold text-gray-900">
                            {cow?.earTagCode || d.animalId}
                            <span className="block text-[11px] text-gray-400 font-normal">{cow?.name}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-700">{d.date}</td>
                          <td className="py-3 px-4 text-emerald-700 font-semibold flex items-center">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            {d.dryOffTherapyProduct || 'Secado sin fármaco'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              En descanso mamario
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500">{d.notes || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Modal for Specialized Dry-Off Registration */}
      {showDryOffModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-200">
                  <PauseCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Registrar Secado & Terapia Mamaria</h3>
                  <p className="text-xs text-amber-200">Protocolo profiláctico de suspensión de ordeño</p>
                </div>
              </div>
              <button
                onClick={() => setShowDryOffModal(false)}
                className="p-1 rounded-full text-amber-200 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDryOff} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Vaca a Secar</label>
                <select
                  value={dryOffCowId}
                  onChange={e => setDryOffCowId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-amber-500"
                >
                  {animals.filter(a => a.gender === 'female').map(a => (
                    <option key={a.id} value={a.id}>
                      {a.earTagCode} - {a.name || 'Sin nombre'} ({a.currentStage})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Fecha Efectiva de Secado</label>
                <input
                  type="date"
                  value={dryOffDate}
                  onChange={e => setDryOffDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Producto de Terapia de Secado (Antibiótico intramamario / Sellador)
                </label>
                <input
                  type="text"
                  value={dryOffProduct}
                  onChange={e => setDryOffProduct(e.target.value)}
                  placeholder="Ej: Cefa-Dry, Ubrocelan, Teatseal..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Infundir un inyector intramamario en cada cuarto tras el último ordeño a fondo.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Notas / Observaciones del Secado</label>
                <textarea
                  rows={2}
                  value={dryOffNotes}
                  onChange={e => setDryOffNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  placeholder="Potrero de maternidad asignado, desinfección de pezones..."
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDryOffModal(false)}
                  className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                >
                  Confirmar Secado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for New Reproduction Event */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-ranch-600" />
              <span>Registrar Evento Reproductivo</span>
            </h2>

            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Hembra Receptora</label>
                <select
                  value={selectedAnimalId}
                  onChange={e => setSelectedAnimalId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-ranch-500"
                >
                  {animals.filter(a => a.gender === 'female').map(a => (
                    <option key={a.id} value={a.id}>
                      {a.earTagCode} - {a.name || 'Sin nombre'} ({a.species})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tipo de Evento</label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-ranch-500"
                  >
                    <option value="insemination">Inseminación Artificial</option>
                    <option value="bull_service">Monta Natural</option>
                    <option value="pregnancy_check">Palpación / Ecografía</option>
                    <option value="dry_off">Secado de Vaca</option>
                    <option value="calving">Parto</option>
                    <option value="heat">Celo Detectado</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha del Evento</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-ranch-500"
                  />
                </div>
              </div>

              {eventType === 'pregnancy_check' ? (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Resultado del Chequeo</label>
                  <select
                    value={pregnancyResult}
                    onChange={e => setPregnancyResult(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-ranch-500"
                  >
                    <option value="pregnant">Preñada (Confirmada)</option>
                    <option value="open">Vacía (Abierta)</option>
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Toro / Pajilla Semen</label>
                    <input
                      type="text"
                      value={sireCode}
                      onChange={e => setSireCode(e.target.value)}
                      placeholder="ej. STRAW-HOL-990"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ranch-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Técnico / Inseminador</label>
                    <input
                      type="text"
                      value={technician}
                      onChange={e => setTechnician(e.target.value)}
                      placeholder="Dr. Ricardo Rivas"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ranch-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-ranch-600 hover:bg-ranch-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  Guardar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
