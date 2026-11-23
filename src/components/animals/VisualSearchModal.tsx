import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  RefreshCw 
} from 'lucide-react';
import type { Animal } from '../../types/animal';
import { VisualSearchService, type VisualMatchResult } from '../../services/visualSearchService';
import { samplePhotos } from '../../services/samplePhotos';

interface VisualSearchModalProps {
  animals: Animal[];
  onClose: () => void;
  onSelectAnimal: (animal: Animal) => void;
}

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({
  animals,
  onClose,
  onSelectAnimal
}) => {
  const [queryImage, setQueryImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<VisualMatchResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const animalMap = new Map(animals.map(a => [a.id, a]));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const compressed = await VisualSearchService.compressImage(file);
      setQueryImage(compressed);
      await runSearch(compressed);
    } catch (err) {
      console.error('Failed to process image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const runSearch = async (imageSrc: string) => {
    setIsProcessing(true);
    // Execute client-side feature extraction & histogram matching
    const matches = await VisualSearchService.searchByPhoto(imageSrc, animals);
    setResults(matches);
    setIsProcessing(false);
  };

  const handleSelectSample = (sampleUrl: string) => {
    setQueryImage(sampleUrl);
    runSearch(sampleUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-ranch-700 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight">Búsqueda Visual por Fotografía</h3>
              <p className="text-xs text-emerald-100">
                Identifica animales en brete o potrero por reconocimiento cromático de capa y patrón
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Upload Area */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {queryImage ? (
              <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-ranch-500 shadow-md shrink-0 bg-gray-100">
                <img src={queryImage} alt="Foto de consulta" className="w-full h-full object-cover" />
                <button
                  onClick={() => {
                    setQueryImage(null);
                    setResults([]);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
                  title="Cambiar foto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-1/2 h-36 border-2 border-dashed border-gray-300 hover:border-ranch-500 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-gray-50 transition-all text-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs font-bold text-gray-700">Subir foto o capturar</span>
                <span className="text-[11px] text-gray-400 mt-0.5">JPG, PNG o foto con cámara</span>
              </div>
            )}

            <div className="flex-1 space-y-2 text-xs">
              <span className="font-bold text-gray-600 block">O prueba con patrones de raza de muestra:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectSample(samplePhotos.holstein('HLP-101'))}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold border border-gray-300 transition-colors"
                >
                  🐄 Overo Holstein
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSample(samplePhotos.brahman('HLP-104', 'white'))}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold border border-gray-300 transition-colors"
                >
                  🐂 Brahman Blanco
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSample(samplePhotos.angus('RPV-301'))}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold border border-gray-300 transition-colors"
                >
                  🐂 Black Angus
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSample(samplePhotos.jersey('HLP-105'))}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold border border-gray-300 transition-colors"
                >
                  🐮 Jersey Castaña
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Results section */}
          {isProcessing && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-ranch-600 animate-spin" />
              <p className="text-xs font-semibold text-gray-600">
                Analizando histograma cromático, tonalidad de capa y contraste...
              </p>
            </div>
          )}

          {!isProcessing && queryImage && results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                  Coincidencias encontradas en el hato ({results.length})
                </h4>
                <span className="text-[11px] text-gray-500 font-medium">Ordenado por similitud visual</span>
              </div>

              <div className="space-y-2.5">
                {results.map((res, idx) => {
                  const animal = animalMap.get(res.animalId);
                  if (!animal) return null;

                  const isTopMatch = idx === 0 && res.similarityScore >= 70;

                  return (
                    <div 
                      key={res.animalId}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isTopMatch 
                          ? 'border-emerald-300 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-400' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                          {animal.photoUrl ? (
                            <img src={animal.photoUrl} alt={animal.earTagCode} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                              Sin Foto
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-sm text-gray-900">
                              {animal.earTagCode}
                            </span>
                            {animal.name && (
                              <span className="text-xs font-medium text-gray-600 truncate">
                                • {animal.name}
                              </span>
                            )}
                            {isTopMatch && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full border border-emerald-200">
                                Mejor Coincidencia
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {animal.breedComposition.map(b => b.breedName).join(' / ')} • {animal.purpose === 'milk' ? 'Leche' : animal.purpose === 'beef' ? 'Carne' : 'Doble Propósito'}
                          </div>

                          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                            {res.reasons.join(' • ')}
                          </div>
                        </div>
                      </div>

                      {/* Score & Select Button */}
                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <div className={`text-base font-extrabold ${
                            res.similarityScore >= 80 ? 'text-emerald-600' : res.similarityScore >= 60 ? 'text-amber-600' : 'text-gray-500'
                          }`}>
                            {res.similarityScore}%
                          </div>
                          <span className="text-[10px] text-gray-400 block font-medium">similitud</span>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onSelectAnimal(animal);
                          }}
                          className="inline-flex items-center px-3 py-1.5 bg-ranch-600 hover:bg-ranch-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Ver Ficha
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isProcessing && queryImage && results.length === 0 && (
            <div className="py-6 text-center text-gray-400 text-xs">
              No hay animales registrados con fotografía para comparar en la base de datos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
