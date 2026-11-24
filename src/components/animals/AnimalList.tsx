import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  AlertTriangle, 
  Eye, 
  Scale, 
  Milk, 
  Heart,
  Tag,
  Camera,
  LayoutGrid,
  List,
  Building2,
  Radio
} from 'lucide-react';
import type { Animal, Lot, Farm } from '../../types/animal';
import { ExcelService } from '../../services/excelService';

interface AnimalListProps {
  animals: Animal[];
  lots: Lot[];
  farms?: Farm[];
  currentFarmId?: string;
  onSelectAnimal: (animal: Animal) => void;
  onOpenCreate: () => void;
  onOpenBulk: () => void;
  onOpenScanner?: () => void;
  onOpenVisualSearch?: () => void;
}

export const AnimalList: React.FC<AnimalListProps> = ({
  animals,
  lots,
  farms = [],
  currentFarmId = 'all',
  onSelectAnimal,
  onOpenCreate,
  onOpenBulk,
  onOpenScanner,
  onOpenVisualSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedLotId, setSelectedLotId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const lotMap = useMemo(() => new Map(lots.map(l => [l.id, l])), [lots]);
  const farmMap = useMemo(() => new Map(farms.map(f => [f.id, f])), [farms]);

  // Filter animals
  const filteredAnimals = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    return animals.filter(a => {
      const matchesSearch = 
        !searchLower ||
        a.earTagCode.toLowerCase().includes(searchLower) ||
        (a.name && a.name.toLowerCase().includes(searchLower)) ||
        (a.electronicId && a.electronicId.toLowerCase().includes(searchLower));

      const matchesGender = selectedGender === 'all' || a.gender === selectedGender;
      const matchesPurpose = selectedPurpose === 'all' || a.purpose === selectedPurpose;
      const matchesStage = selectedStage === 'all' || a.currentStage === selectedStage;
      const matchesLot = selectedLotId === 'all' || a.lotId === selectedLotId;

      return matchesSearch && matchesGender && matchesPurpose && matchesStage && matchesLot;
    });
  }, [animals, searchTerm, selectedGender, selectedPurpose, selectedStage, selectedLotId]);

  const handleExportExcel = async () => {
    const blob = await ExcelService.exportAnimalsToExcel(filteredAnimals);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventario_Ganado_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight flex items-center flex-wrap gap-2">
            <span>Inventario de Ganado</span>
            <span className="text-xs sm:text-sm font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 tabular-nums">
              {filteredAnimals.length} de {animals.length} cabezas
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {currentFarmId === 'all' 
              ? 'Visión consolidada de todas las haciendas registradas con trazabilidad fotográfica'
              : `Hacienda activa: ${farmMap.get(currentFarmId)?.name || 'Finca'} • Control individual de pesaje y ordeño`}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-nowrap items-center gap-2 shrink-0">
          {/* Primary Action */}
          <button
            onClick={onOpenCreate}
            className="col-span-2 sm:col-span-1 sm:order-4 inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-1.5 shrink-0" />
            Nuevo Animal
          </button>

          {/* Visual Search Button */}
          <button
            onClick={() => onOpenVisualSearch && onOpenVisualSearch()}
            className="sm:order-1 inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors whitespace-nowrap"
            title="Buscar ganado cargando o tomando una fotografía"
          >
            <Camera className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
            Buscar por Foto
          </button>

          <button
            onClick={handleExportExcel}
            className="sm:order-2 inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-gray-50 text-gray-700 transition-colors border border-gray-200 shadow-2xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            Exportar
          </button>
          <button
            onClick={onOpenBulk}
            className="col-span-2 sm:col-span-1 sm:order-3 inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-gray-50 text-gray-700 transition-colors border border-gray-200 shadow-2xs whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            Carga Masiva
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        {/* Row 1: Search + RFID + View Toggle */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="flex items-center flex-1 gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por arete (ej. HLP-101), nombre o chip RFID..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ranch-500 focus:bg-white transition-all"
              />
            </div>
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-colors shrink-0 whitespace-nowrap"
                title="Lector de Chip RFID / NFC y Aretes"
              >
                <Radio className="w-3.5 h-3.5 text-amber-600" />
                <span>Chip / NFC</span>
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vista de lista detallada"
            >
              <List className="w-4 h-4" />
              <span>Tabla</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vista en cuadrícula con fotos"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Fotos</span>
            </button>
          </div>
        </div>

        {/* Row 2: Quick Filter Selects */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 text-xs">
          {/* Stage */}
          <select
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 text-[11px] sm:text-xs truncate focus:outline-none focus:ring-2 focus:ring-ranch-500"
          >
            <option value="all">Todas las Etapas</option>
            <option value="calf">Ternero / Cría</option>
            <option value="weaned">Destete</option>
            <option value="juvenile">Levante / Novillo</option>
            <option value="adult">Adulto</option>
          </select>

          {/* Purpose */}
          <select
            value={selectedPurpose}
            onChange={e => setSelectedPurpose(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 text-[11px] sm:text-xs truncate focus:outline-none focus:ring-2 focus:ring-ranch-500"
          >
            <option value="all">Todos los Propósitos</option>
              <option value="milk">Lechero</option>
              <option value="beef">Carne / Ceba</option>
              <option value="dual_purpose">Doble Propósito</option>
              <option value="breeding">Reproductor</option>
            </select>

            {/* Sex */}
            <select
              value={selectedGender}
              onChange={e => setSelectedGender(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ranch-500"
            >
              <option value="all">Todos los Sexos</option>
              <option value="female">Hembra</option>
              <option value="male">Macho Entero</option>
              <option value="castrated">Castrado / Buey</option>
            </select>

            {/* Lot */}
            <select
              value={selectedLotId}
              onChange={e => setSelectedLotId(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ranch-500"
            >
              <option value="all">Todos los Lotes</option>
              {lots.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
      </div>

      {/* Main View: Table Mode (Mobile Card List + Desktop Table) */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Mobile Compact List (< md) */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredAnimals.length === 0 ? (
              <div className="py-12 px-4 text-center text-gray-400 text-sm font-medium">
                No se encontraron animales con los filtros seleccionados.
              </div>
            ) : (
              filteredAnimals.map(animal => {
                const lot = animal.lotId ? lotMap.get(animal.lotId) : undefined;
                const breedSummary = animal.breedComposition.map(b => b.breedName).join(' × ') || 'Mestizo';
                return (
                  <button
                    key={animal.id}
                    type="button"
                    onClick={() => onSelectAnimal(animal)}
                    className="w-full text-left p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/80 active:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                        {animal.photoUrl ? (
                          <img src={animal.photoUrl} alt={animal.earTagCode} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Tag className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-gray-900 text-sm font-mono whitespace-nowrap">
                            {animal.earTagCode}
                          </span>
                          {animal.name && (
                            <span className="text-sm font-semibold text-gray-700 truncate">
                              · {animal.name}
                            </span>
                          )}
                          {animal.electronicId && (
                            <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-mono bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                              RFID
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {breedSummary} · {animal.gender === 'female' ? 'Hembra' : animal.gender === 'male' ? 'Macho' : 'Castrado'}
                        </div>
                        <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                          {lot && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap"
                              style={{ backgroundColor: `${lot.color || '#3b82f6'}15`, color: lot.color || '#3b82f6' }}
                            >
                              {lot.name}
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-gray-800 tabular-nums">
                            {animal.currentWeightKg ? `${animal.currentWeightKg} kg` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                );
              })
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-semibold text-gray-500 tracking-wider">
                <tr>
                  <th className="py-3 pl-4 pr-2">Animal & Arete</th>
                  <th className="py-3 px-2.5">Nombre / Raza</th>
                  {currentFarmId === 'all' && <th className="py-3 px-2.5">Hacienda</th>}
                  <th className="py-3 px-2.5">Sexo / Etapa</th>
                  <th className="py-3 px-2.5">Lote</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Peso</th>
                  <th className="py-3 px-2.5">Propósito</th>
                  <th className="py-3 px-2.5">Estado</th>
                  <th className="py-3 pl-2 pr-4 text-center">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAnimals.length === 0 ? (
                  <tr>
                    <td colSpan={currentFarmId === 'all' ? 9 : 8} className="py-12 text-center text-gray-400 font-medium">
                      No se encontraron animales con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredAnimals.map(animal => {
                    const lot = animal.lotId ? lotMap.get(animal.lotId) : undefined;
                    const farm = farmMap.get(animal.farmId);
                    const breedSummary = animal.breedComposition.map(b => b.breedName).join(' × ') || 'Mestizo';

                    return (
                      <tr 
                        key={animal.id}
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                        onClick={() => onSelectAnimal(animal)}
                      >
                        {/* Photo Thumbnail + Ear Tag */}
                        <td className="py-3 pl-4 pr-2">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-gray-100 shadow-2xs">
                              {animal.photoUrl ? (
                                <img src={animal.photoUrl} alt={animal.earTagCode} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Tag className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-gray-900 group-hover:text-ranch-700 transition-colors font-mono whitespace-nowrap">
                                  {animal.earTagCode}
                                </span>
                                {animal.electronicId && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                    RFID
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-400 font-mono">
                                {animal.electronicId ? animal.electronicId.slice(-6) : 'Visual'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Name / Breed */}
                        <td className="py-3 px-2.5">
                          <div className="font-medium text-gray-800">
                            {animal.name || 'Sin nombre'}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[140px]">
                            {breedSummary}
                          </div>
                        </td>

                        {/* Farm (in Global View) */}
                        {currentFarmId === 'all' && (
                          <td className="py-3 px-2.5 text-xs font-semibold text-gray-700 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              <span>{farm?.name || 'Finca'}</span>
                            </div>
                          </td>
                        )}

                        {/* Gender / Stage */}
                        <td className="py-3 px-2.5 whitespace-nowrap">
                          <div className="capitalize text-xs font-medium text-gray-700">
                            {animal.gender === 'female' ? 'Hembra' : animal.gender === 'male' ? 'Macho' : 'Castrado'}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {animal.currentStage === 'calf' ? 'Ternero' : animal.currentStage === 'weaned' ? 'Destete' : animal.currentStage === 'juvenile' ? 'Novillo / Ceba' : 'Adulto'}
                          </div>
                        </td>

                        {/* Lot */}
                        <td className="py-3 px-2.5">
                          {lot ? (
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
                              style={{ backgroundColor: `${lot.color || '#3b82f6'}15`, color: lot.color || '#3b82f6' }}
                            >
                              {lot.name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin lote</span>
                          )}
                        </td>

                        {/* Weight */}
                        <td className="py-3 px-2.5 text-right whitespace-nowrap">
                          <span className="font-semibold text-gray-800 tabular-nums">
                            {animal.currentWeightKg ? `${animal.currentWeightKg} kg` : '—'}
                          </span>
                        </td>

                        {/* Purpose */}
                        <td className="py-3 px-2.5 whitespace-nowrap">
                          <span className="inline-flex items-center text-xs font-medium text-gray-600">
                            {animal.purpose === 'milk' ? (
                              <><Milk className="w-3.5 h-3.5 mr-1 text-blue-500" /> Leche</>
                            ) : animal.purpose === 'beef' ? (
                              <><Scale className="w-3.5 h-3.5 mr-1 text-amber-600" /> Carne</>
                            ) : animal.purpose === 'breeding' ? (
                              <><Heart className="w-3.5 h-3.5 mr-1 text-red-500" /> Cría</>
                            ) : (
                              <><Tag className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Doble</>
                            )}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-2.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Activo
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 pl-2 pr-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAnimal(animal);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-ranch-700 hover:bg-gray-100 transition-colors"
                            title="Ver ficha completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Photo Grid / Cards Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAnimals.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400 font-medium bg-white rounded-2xl border border-gray-200">
              No se encontraron animales con los filtros seleccionados.
            </div>
          ) : (
            filteredAnimals.map(animal => {
              const lot = animal.lotId ? lotMap.get(animal.lotId) : undefined;
              const farm = farmMap.get(animal.farmId);
              return (
                <div
                  key={animal.id}
                  onClick={() => onSelectAnimal(animal)}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col"
                >
                  {/* Photo Banner */}
                  <div className="h-44 bg-gray-100 relative overflow-hidden">
                    {animal.photoUrl ? (
                      <img 
                        src={animal.photoUrl} 
                        alt={animal.earTagCode} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Camera className="w-8 h-8 mb-1" />
                        <span className="text-xs font-semibold">Sin fotografía</span>
                      </div>
                    )}
                    {/* Ear Tag Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-white font-mono font-bold text-xs">
                      {animal.earTagCode}
                    </div>

                    {/* Purpose Pill */}
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-xs text-gray-800 font-bold text-[10px] uppercase">
                      {animal.purpose === 'milk' ? 'Leche' : animal.purpose === 'beef' ? 'Carne' : 'Doble'}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-ranch-700 transition-colors truncate">
                          {animal.name || `Animal ${animal.earTagCode}`}
                        </h4>
                        <span className="text-xs font-extrabold text-gray-900 shrink-0">
                          {animal.currentWeightKg ? `${animal.currentWeightKg} kg` : '—'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {animal.breedComposition.map(b => b.breedName).join(' × ')}
                      </p>

                      {currentFarmId === 'all' && (
                        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          {farm?.name || 'Finca'}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      {lot ? (
                        <span 
                          className="px-2 py-0.5 rounded text-[11px] font-semibold truncate max-w-[130px]"
                          style={{ backgroundColor: `${lot.color || '#3b82f6'}15`, color: lot.color || '#3b82f6' }}
                        >
                          {lot.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Sin lote</span>
                      )}

                      <span className="text-ranch-600 font-bold flex items-center text-xs group-hover:underline">
                        Ver Ficha <Eye className="w-3 h-3 ml-1" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
