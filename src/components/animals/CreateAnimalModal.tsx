import React, { useState, useRef } from 'react';
import { X, Tag, Save, Radio, Camera, Upload, Trash2, Image as ImageIcon, MapPin, Loader2, Sparkles } from 'lucide-react';
import type { Animal, Lot, Species, Gender, LifeStage, AnimalPurpose, Farm } from '../../types/animal';
import { db } from '../../db';
import { syncEngine } from '../../sync/engine';
import { VisualSearchService } from '../../services/visualSearchService';
import { samplePhotos } from '../../services/samplePhotos';
import { GpsService, type GpsCoordinateResult } from '../../services/gpsService';
import { StageTransitionEngine } from '../../services/stageTransitionEngine';
import { UniversalChipScannerModal } from '../scanner/UniversalChipScannerModal';

interface CreateAnimalModalProps {
  lots: Lot[];
  farms: Farm[];
  currentFarmId?: string;
  onClose: () => void;
  onCreated: (animal: Animal) => void;
}

export const CreateAnimalModal: React.FC<CreateAnimalModalProps> = ({
  lots,
  farms,
  currentFarmId,
  onClose,
  onCreated
}) => {
  const [earTagCode, setEarTagCode] = useState('');
  const [electronicId, setElectronicId] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('bovine');
  const [gender, setGender] = useState<Gender>('female');
  const [currentStage, setCurrentStage] = useState<LifeStage>('adult');
  const [purpose, setPurpose] = useState<AnimalPurpose>('milk');
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState<string>('450');
  const [breedName, setBreedName] = useState('Girolando');
  const [selectedFarmId, setSelectedFarmId] = useState<string>(
    currentFarmId && currentFarmId !== 'all' ? currentFarmId : farms[0]?.id || 'farm-1'
  );
  const [lotId, setLotId] = useState<string>(lots[0]?.id || '');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<GpsCoordinateResult | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    try {
      const { months } = StageTransitionEngine.calculateAge(val);
      const targetFarm = farms.find(f => f.id === selectedFarmId);
      const rec = StageTransitionEngine.getRecommendedStage(months, targetFarm?.stageConfig);
      setCurrentStage(rec);
    } catch (e) {
      // ignore
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await VisualSearchService.compressImage(file);
      setPhotoUrl(compressed);
    } catch (err) {
      console.error('Error compressing image:', err);
    }
  };

  const handleApplyPresetPhoto = (type: 'holstein' | 'brahman' | 'angus' | 'jersey') => {
    const tag = earTagCode.trim() || 'NEW-01';
    if (type === 'holstein') setPhotoUrl(samplePhotos.holstein(tag));
    else if (type === 'brahman') setPhotoUrl(samplePhotos.brahman(tag, 'white'));
    else if (type === 'angus') setPhotoUrl(samplePhotos.angus(tag));
    else if (type === 'jersey') setPhotoUrl(samplePhotos.jersey(tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!earTagCode.trim()) {
      setError('El arete o código visual es obligatorio.');
      return;
    }

    // Check duplicate tag code
    const existing = await db.animals.where('earTagCode').equalsIgnoreCase(earTagCode.trim()).first();
    if (existing) {
      setError(`Ya existe un animal registrado con el arete ${earTagCode}.`);
      return;
    }

    const newAnimal: Animal = {
      id: 'anm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      earTagCode: earTagCode.trim(),
      electronicId: electronicId.trim() || undefined,
      name: name.trim() || undefined,
      species,
      gender,
      currentStage,
      purpose,
      birthDate,
      currentWeightKg: weightKg ? Number(weightKg) : undefined,
      breedComposition: [{ breedId: 'primary', breedName: breedName.trim(), percentage: 100 }],
      farmId: selectedFarmId,
      lotId: lotId || undefined,
      photoUrl,
      status: 'active',
      gpsCoordinates: gpsLocation ? {
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        accuracyMeters: gpsLocation.accuracy,
        recordedAt: Date.now()
      } : undefined,
      notes: notes.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    };

    await db.animals.put(newAnimal);
    await syncEngine.queueAction('animal', 'create', newAnimal.id, newAnimal);

    onCreated(newAnimal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-ranch-100 text-ranch-700 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Registrar Nuevo Animal</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Photo Upload Section */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
            <span className="block text-xs font-bold text-gray-700 flex items-center justify-between">
              <span className="flex items-center">
                <Camera className="w-4 h-4 mr-1 text-ranch-600" />
                Fotografía del Animal
              </span>
              <span className="text-[10px] text-gray-400">Requerida para Búsqueda Visual</span>
            </span>

            <div className="flex items-center gap-3">
              {photoUrl ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-300 shadow-xs shrink-0 bg-white">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(undefined)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 shadow-xs"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 border-2 border-dashed border-gray-300 hover:border-ranch-500 rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer bg-white hover:bg-ranch-50/50 transition-colors shrink-0 text-center"
                >
                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-[10px] font-bold text-gray-600">Subir Foto</span>
                </div>
              )}

              <div className="flex-1 space-y-1.5 text-xs">
                <p className="text-[11px] text-gray-500">
                  Sube una foto real o selecciona un prototipo según el pelaje:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPresetPhoto('holstein')}
                    className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-semibold hover:bg-gray-100"
                  >
                    Overo (Holstein)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetPhoto('brahman')}
                    className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-semibold hover:bg-gray-100"
                  >
                    Blanco (Brahman)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetPhoto('angus')}
                    className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-semibold hover:bg-gray-100"
                  >
                    Negro (Angus)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetPhoto('jersey')}
                    className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-semibold hover:bg-gray-100"
                  >
                    Castaño (Jersey)
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Farm Assignment */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Hacienda / Finca de Destino <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedFarmId}
              onChange={e => setSelectedFarmId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white"
            >
              {farms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.location || f.country} • {f.purpose})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Arete / Código Visual <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={earTagCode}
                onChange={e => setEarTagCode(e.target.value)}
                placeholder="ej. HLP-108"
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700">
                  Chip / RFID (Opcional)
                </label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
                >
                  <Radio className="w-3 h-3 text-amber-600 animate-pulse" />
                  <span>Escanear</span>
                </button>
              </div>
              <input
                type="text"
                value={electronicId}
                onChange={e => setElectronicId(e.target.value)}
                placeholder="ej. 982000412891..."
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nombre del Animal
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ej. Mariposa, Titan..."
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Raza Predominante
              </label>
              <input
                type="text"
                value={breedName}
                onChange={e => setBreedName(e.target.value)}
                placeholder="ej. Holstein, Girolando, Brahman..."
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Sexo
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white"
              >
                <option value="female">Hembra</option>
                <option value="male">Macho</option>
                <option value="castrated">Castrado / Novillo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Etapa de Vida
              </label>
              <select
                value={currentStage}
                onChange={e => setCurrentStage(e.target.value as LifeStage)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white"
              >
                <option value="calf">Ternero/a</option>
                <option value="weaned">Destete</option>
                <option value="juvenile">Levante / Novilla</option>
                <option value="adult">Adulto / Vaca / Toro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Propósito
              </label>
              <select
                value={purpose}
                onChange={e => setPurpose(e.target.value as AnimalPurpose)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white"
              >
                <option value="milk">Leche</option>
                <option value="beef">Carne / Ceba</option>
                <option value="dual_purpose">Doble Propósito</option>
                <option value="breeding">Reproducción</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={e => handleBirthDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Peso Inicial / Actual (kg)
              </label>
              <input
                type="number"
                step="0.5"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                placeholder="450"
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white"
              />
            </div>
          </div>

          {/* GPS Capture of Animal Location / Potrero */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Geolocalización GPS (Potrero de Nacimiento / Finca)</span>
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
                    Capturar GPS
                  </>
                )}
              </button>
            </div>

            {gpsLocation && (
              <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <div className="font-bold flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    <span>{GpsService.validateAgainstFarm(gpsLocation).statusText}</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                    Lat: {gpsLocation.latitude.toFixed(5)}, Lon: {gpsLocation.longitude.toFixed(5)} (±{gpsLocation.accuracy}m)
                  </div>
                </div>
                <a
                  href={GpsService.getGoogleMapsUrl(gpsLocation.latitude, gpsLocation.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-blue-600 hover:underline bg-white px-2 py-1 rounded-lg border border-emerald-200 shrink-0 text-center"
                >
                  Ver en Mapa ↗
                </a>
              </div>
            )}

            {gpsError && (
              <div className="mt-1 text-[11px] text-rose-600">
                {gpsError}
              </div>
            )}
          </div>

          {lots.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Asignar a Lote
              </label>
              <select
                value={lotId}
                onChange={e => setLotId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white"
              >
                <option value="">Sin lote específico</option>
                {lots.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Notas u Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Genealogía, señas particulares, historial de salud..."
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-5 py-2 text-xs font-bold rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white shadow-xs transition-colors"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Guardar Animal
            </button>
          </div>
        </form>
      </div>

      <UniversalChipScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        animals={[]}
        onScannedCode={(code) => setElectronicId(code)}
        title="Escanear Chip / Arete del Animal"
      />
    </div>
  );
};
