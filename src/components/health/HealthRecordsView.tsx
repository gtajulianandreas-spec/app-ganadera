import React, { useState, useMemo } from 'react';
import { 
  HeartPulse, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Syringe, 
  Clock, 
  FileText,
  MapPin,
  ExternalLink,
  Loader2
} from 'lucide-react';
import type { HealthRecord, DoseUnit } from '../../types/production';
import type { Animal } from '../../types/animal';
import { db } from '../../db';
import { syncEngine } from '../../sync/engine';
import { GpsService, type GpsCoordinateResult } from '../../services/gpsService';
import { generateId } from '../../utils/id';

interface HealthRecordsViewProps {
  healthRecords: HealthRecord[];
  animals: Animal[];
  onRefresh: () => void;
}

export const HealthRecordsView: React.FC<HealthRecordsViewProps> = ({
  healthRecords,
  animals,
  onRefresh
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(animals[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<HealthRecord['type']>('vaccine');
  const [treatmentName, setTreatmentName] = useState('Aftogan (Fiebre Aftosa)');
  const [doseAmount, setDoseAmount] = useState('2.0');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('ml');
  const [route, setRoute] = useState<HealthRecord['administrationRoute']>('subcutaneous');
  const [batchNumber, setBatchNumber] = useState('LOT-2026-B');
  const [expirationDate, setExpirationDate] = useState('');
  const [vetName, setVetName] = useState('Dr. Ricardo Rivas');
  const [withdrawalMilk, setWithdrawalMilk] = useState('0');
  const [withdrawalMeat, setWithdrawalMeat] = useState('0');
  const [diagnosis, setDiagnosis] = useState('');
  const [cost, setCost] = useState('4.50');
  const [notes, setNotes] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<GpsCoordinateResult | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const animalMap = useMemo(() => new Map(animals.map(a => [a.id, a])), [animals]);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Calculate active withdrawal restrictions
  const activeMilkWithdrawals = useMemo(() => {
    return healthRecords.filter(r => r.safeMilkDate && r.safeMilkDate >= todayStr);
  }, [healthRecords, todayStr]);

  const activeMeatWithdrawals = useMemo(() => {
    return healthRecords.filter(r => r.safeMeatDate && r.safeMeatDate >= todayStr);
  }, [healthRecords, todayStr]);

  const handleCaptureGps = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const loc = await GpsService.getCurrentLocation();
      setGpsLocation(loc);
    } catch (err: any) {
      setGpsError(err.message || 'Error al obtener GPS');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentName.trim()) return;

    const eventDate = new Date(date);
    const milkDays = parseInt(withdrawalMilk, 10) || 0;
    const meatDays = parseInt(withdrawalMeat, 10) || 0;

    let safeMilkDate: string | undefined;
    if (milkDays > 0) {
      const d = new Date(eventDate);
      d.setDate(d.getDate() + milkDays);
      safeMilkDate = d.toISOString().split('T')[0];
    }

    let safeMeatDate: string | undefined;
    if (meatDays > 0) {
      const d = new Date(eventDate);
      d.setDate(d.getDate() + meatDays);
      safeMeatDate = d.toISOString().split('T')[0];
    }

    const parsedDose = doseAmount ? parseFloat(doseAmount) : undefined;

    const selectedAnimal = animalMap.get(selectedAnimalId);

    const record: HealthRecord = {
      id: generateId('hlt'),
      farmId: selectedAnimal?.farmId,
      animalId: selectedAnimalId,
      date,
      type,
      treatmentName: treatmentName.trim(),
      diagnosis: diagnosis.trim() || undefined,
      batchNumber: batchNumber.trim() || undefined,
      expirationDate: expirationDate || undefined,
      doseAmount: parsedDose,
      doseUnit,
      doseMl: doseUnit === 'ml' || doseUnit === 'cc' ? parsedDose : undefined,
      administrationRoute: route,
      veterinarianName: vetName.trim() || undefined,
      withdrawalDaysMilk: milkDays,
      withdrawalDaysMeat: meatDays,
      safeMilkDate,
      safeMeatDate,
      cost: cost ? parseFloat(cost) : undefined,
      gpsCoordinates: gpsLocation ? { latitude: gpsLocation.latitude, longitude: gpsLocation.longitude } : undefined,
      notes: notes.trim() || undefined,
      createdAt: Date.now()
    };

    await db.healthRecords.put(record);
    await syncEngine.queueAction('health', 'create', record.id, record);
    setShowAddModal(false);
    setGpsLocation(null);
    onRefresh();
  };

  const filteredRecords = useMemo(() => {
    return healthRecords.filter(r => {
      if (filterType === 'all') return true;
      return r.type === filterType;
    });
  }, [healthRecords, filterType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <span>Sanidad, Vacunación y Períodos de Retiro</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Control de biológicos, dosis aplicadas, antibióticos y aseguramiento de inocuidad en leche y carne
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white shadow-xs transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Registrar Tratamiento
        </button>
      </div>

      {/* Warning Banners for Active Withdrawals */}
      {(activeMilkWithdrawals.length > 0 || activeMeatWithdrawals.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeMilkWithdrawals.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-900">
                  {activeMilkWithdrawals.length} Animales con Leche en Retiro
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  ¡No enviar al tanque de leche comunal! Contiene residuos de medicamentos.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeMilkWithdrawals.map(w => {
                    const cow = animalMap.get(w.animalId);
                    return (
                      <span key={w.id} className="text-xs bg-rose-200 text-rose-800 font-bold px-2 py-0.5 rounded">
                        {cow?.earTagCode || w.animalId}: libre el {w.safeMilkDate}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeMeatWithdrawals.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  {activeMeatWithdrawals.length} Animales con Restricción de Faena
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Prohibido su despacho a frigorífico hasta cumplir el tiempo reglamentario de retiro en carne.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeMeatWithdrawals.map(w => {
                    const cow = animalMap.get(w.animalId);
                    return (
                      <span key={w.id} className="text-xs bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded">
                        {cow?.earTagCode || w.animalId}: apto el {w.safeMeatDate}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wide">
            <span>Tratamientos Totales</span>
            <Syringe className="w-4 h-4 text-ranch-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">{healthRecords.length}</div>
          <div className="text-xs text-gray-500 mt-1">Registros clínicos en la base local</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wide">
            <span>Animales en Retiro Leche</span>
            <ShieldAlert className={`w-4 h-4 ${activeMilkWithdrawals.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <div className={`mt-2 text-2xl font-bold tabular-nums ${activeMilkWithdrawals.length > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
            {activeMilkWithdrawals.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Control estricto antibióticos</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wide">
            <span>Animales en Retiro Carne</span>
            <AlertTriangle className={`w-4 h-4 ${activeMeatWithdrawals.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
          </div>
          <div className={`mt-2 text-2xl font-bold tabular-nums ${activeMeatWithdrawals.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {activeMeatWithdrawals.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Tiempo de espera para beneficio</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
        {[
          { id: 'all', label: 'Todos los Registros' },
          { id: 'vaccine', label: 'Vacunas y Biológicos' },
          { id: 'treatment', label: 'Tratamientos Clínicos' },
          { id: 'antiparasitic', label: 'Desparasitaciones' },
          { id: 'mastitis', label: 'Mastitis' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterType === tab.id
                ? 'bg-ranch-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Health Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="pl-4 pr-2 py-3">Fecha</th>
                <th className="px-2 py-3">Animal</th>
                <th className="px-2 py-3">Tipo</th>
                <th className="px-2 py-3">Medicamento / Lote</th>
                <th className="px-2 py-3">Dosis & Vía</th>
                <th className="px-2 py-3">Períodos de Retiro</th>
                <th className="pl-2 pr-4 py-3">Veterinario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No hay registros de sanidad cargados con este filtro.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => {
                  const animal = animalMap.get(r.animalId);
                  const isMilkRestricted = r.safeMilkDate && r.safeMilkDate >= todayStr;
                  const isMeatRestricted = r.safeMeatDate && r.safeMeatDate >= todayStr;
                  const typeLabel: Record<string, string> = {
                    vaccine: 'Vacuna',
                    treatment: 'Tratamiento',
                    antiparasitic: 'Desparasitante',
                    mastitis: 'Mastitis',
                    castration: 'Castración',
                    checkup: 'Chequeo'
                  };
                  const routeLabel: Record<string, string> = {
                    subcutaneous: 'Subcutánea',
                    intramuscular: 'Intramuscular',
                    intravenous: 'Intravenosa',
                    topical: 'Tópica',
                    intramammary: 'Intramamaria',
                    oral: 'Oral',
                    'pour-on': 'Pour-on'
                  };

                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="pl-4 pr-2 py-3 font-medium text-gray-700 whitespace-nowrap tabular-nums">{r.date}</td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <div className="font-bold text-gray-900 font-mono">{animal?.earTagCode || r.animalId}</div>
                        {animal?.name && <div className="text-[11px] text-gray-500">{animal.name}</div>}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          {typeLabel[r.type] || r.type}
                        </span>
                      </td>
                      <td className="px-2 py-3 font-semibold text-gray-900">
                        <div>{r.treatmentName}</div>
                        {r.batchNumber && <div className="text-[11px] font-mono font-normal text-gray-500">Lote: {r.batchNumber}</div>}
                        {r.diagnosis && <p className="text-[11px] text-gray-500 font-normal">Diag: {r.diagnosis}</p>}
                      </td>
                      <td className="px-2 py-3 text-gray-700 whitespace-nowrap">
                        <span className="font-semibold text-gray-900 tabular-nums">
                          {r.doseAmount || r.doseMl || 'N/A'} {r.doseUnit || (r.doseMl ? 'mL' : '')}
                        </span>
                        {r.administrationRoute && (
                          <span className="block text-[11px] text-gray-500">
                            Vía: {routeLabel[r.administrationRoute] || r.administrationRoute}
                          </span>
                        )}
                        {r.gpsCoordinates && (
                          <a
                            href={GpsService.getGoogleMapsUrl(r.gpsCoordinates.latitude, r.gpsCoordinates.longitude)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[10px] text-blue-600 hover:underline mt-0.5"
                            title="Ver ubicación en Google Maps"
                          >
                            <MapPin className="w-3 h-3 mr-0.5 text-blue-500" />
                            GPS: {r.gpsCoordinates.latitude.toFixed(3)}, {r.gpsCoordinates.longitude.toFixed(3)}
                          </a>
                        )}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-400 mr-1">Leche:</span>
                            {r.withdrawalDaysMilk > 0 ? (
                              isMilkRestricted ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                                  Hasta {r.safeMilkDate}
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">Cumplido ({r.withdrawalDaysMilk}d)</span>
                              )
                            ) : (
                              <span className="text-gray-600 font-medium">Sin retiro</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-400 mr-1">Carne:</span>
                            {r.withdrawalDaysMeat > 0 ? (
                              isMeatRestricted ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                                  Hasta {r.safeMeatDate}
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">Apto ({r.withdrawalDaysMeat}d)</span>
                              )
                            ) : (
                              <span className="text-gray-600 font-medium">Sin retiro</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.veterinarianName || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Treatment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Syringe className="w-5 h-5 text-ranch-600" />
                <span>Registrar Tratamiento / Sanidad</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Animal</label>
                  <select
                    value={selectedAnimalId}
                    onChange={e => setSelectedAnimalId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                    required
                  >
                    {animals.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.earTagCode} - {a.name || a.currentStage}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fecha de Aplicación</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tipo de Evento</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="vaccine">Vacunación / Biológico</option>
                    <option value="treatment">Tratamiento Clínico / Antibiótico</option>
                    <option value="antiparasitic">Desparasitante / Purgante</option>
                    <option value="mastitis">Tratamiento de Mastitis</option>
                    <option value="castration">Castración / Cirugía</option>
                    <option value="checkup">Chequeo General</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Vía de Administración</label>
                  <select
                    value={route}
                    onChange={e => setRoute(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="subcutaneous">Subcutánea (SC)</option>
                    <option value="intramuscular">Intramuscular (IM)</option>
                    <option value="intravenous">Intravenosa (IV)</option>
                    <option value="topical">Tópica / Pour-On</option>
                    <option value="intramammary">Intramamaria (Pezones)</option>
                    <option value="oral">Oral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nombre del Medicamento / Tratamiento</label>
                <input
                  type="text"
                  value={treatmentName}
                  onChange={e => setTreatmentName(e.target.value)}
                  placeholder="Ej: Ceftiofur, Oxitetraciclina L.A., Aftogan..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  required
                />
              </div>

              {/* Dosis Exacta y Unidad (Mejora solicitada de Control Ganadero) */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                  <span>Dosis Aplicada y Lote Farmacológico</span>
                  <span className="text-[10px] text-blue-700 font-normal">Dosis exacta por peso/ficha</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Cantidad</label>
                    <input
                      type="number"
                      step="0.01"
                      value={doseAmount}
                      onChange={e => setDoseAmount(e.target.value)}
                      placeholder="Ej: 5.0"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Unidad</label>
                    <select
                      value={doseUnit}
                      onChange={e => setDoseUnit(e.target.value as DoseUnit)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="ml">mL / cc</option>
                      <option value="mg">mg</option>
                      <option value="g">gramos</option>
                      <option value="dosis">Dosis / Frasco</option>
                      <option value="tableta">Tableta</option>
                      <option value="spray">Spray / Aplic.</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Lote / Registro</label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={e => setBatchNumber(e.target.value)}
                      placeholder="LOT-2026-X"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Fecha Vencimiento Medicamento</label>
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={e => setExpirationDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Costo Tratamiento ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={cost}
                      onChange={e => setCost(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Geolocalización GPS del Tratamiento */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Ubicación GPS de Aplicación (Potrero / Manga)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    disabled={gpsLoading}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                  >
                    {gpsLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Obteniendo GPS...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3 h-3 mr-1 text-emerald-600" />
                        Capturar GPS Actual
                      </>
                    )}
                  </button>
                </div>

                {gpsLocation && (
                  <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center justify-between">
                    <span>
                      📍 Lat: {gpsLocation.latitude.toFixed(5)}, Lon: {gpsLocation.longitude.toFixed(5)} (±{gpsLocation.accuracy}m)
                    </span>
                    <a
                      href={GpsService.getGoogleMapsUrl(gpsLocation.latitude, gpsLocation.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold flex items-center ml-2"
                    >
                      Ver mapa <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                )}

                {gpsError && (
                  <div className="mt-1 text-[11px] text-rose-600">
                    {gpsError} (puedes continuar sin GPS si estás fuera de cobertura satelital).
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Tiempos de Retiro (Días de Inocuidad)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-amber-900 mb-0.5">Retiro en Leche (Días)</label>
                    <input
                      type="number"
                      value={withdrawalMilk}
                      onChange={e => setWithdrawalMilk(e.target.value)}
                      min="0"
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-amber-900 mb-0.5">Retiro en Carne (Días)</label>
                    <input
                      type="number"
                      value={withdrawalMeat}
                      onChange={e => setWithdrawalMeat(e.target.value)}
                      min="0"
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Veterinario / Aplicador</label>
                  <input
                    type="text"
                    value={vetName}
                    onChange={e => setVetName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Diagnóstico / Motivo</label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    placeholder="Ej: Prevención estacional, cojera..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ranch-600 text-white rounded-xl font-semibold hover:bg-ranch-700 shadow-xs"
                >
                  Guardar Tratamiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
