import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Layers,
  Check
} from 'lucide-react';
import { ExcelService, type ImportPreviewRow } from '../../services/excelService';
import type { Lot } from '../../types/animal';

interface BulkManagerModalProps {
  lots: Lot[];
  currentFarmId?: string;
  onClose: () => void;
  onImportCompleted: (count: number) => void;
}

export const BulkManagerModal: React.FC<BulkManagerModalProps> = ({
  lots,
  currentFarmId = 'farm-1',
  onClose,
  onImportCompleted
}) => {
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedSuccessCount, setImportedSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetFarmId = currentFarmId && currentFarmId !== 'all' ? currentFarmId : 'farm-1';

  const handleDownloadTemplate = () => {
    const blob = ExcelService.generateTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Plantilla_Importacion_Ganado.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const rows = await ExcelService.parseSpreadsheet(file, targetFarmId);
      setPreviewRows(rows);
    } catch (err) {
      alert('Error al leer el archivo Excel/CSV. Verifica el formato.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = async () => {
    setIsProcessing(true);
    try {
      const count = await ExcelService.commitImport(previewRows, targetFarmId, selectedLotId || undefined);
      setImportedSuccessCount(count);
      onImportCompleted(count);
    } catch (err) {
      alert('Error al guardar los registros importados.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = previewRows.filter(r => r.isValid).length;
  const invalidCount = previewRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-ranch-100 text-ranch-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Gestión Masiva de Animales (Excel / CSV)</h2>
              <p className="text-xs text-gray-500">Carga e importa cientos de cabezas de ganado en segundos sin errores</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">

          {importedSuccessCount !== null ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">¡Importación Exitosa!</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Se han añadido <span className="font-bold text-emerald-700">{importedSuccessCount} animales</span> al inventario de la finca con sus aretes y razas registrados.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 text-xs font-bold rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white shadow-xs"
              >
                Cerrar y Ver Inventario
              </button>
            </div>
          ) : (
            <>
              {/* Step 1 & 2 Action Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Download Template Box */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 flex items-center space-x-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>1. Descargar Plantilla Oficial</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Plantilla preformateada en Excel con columnas y ejemplos
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center px-3 py-2 text-xs font-bold rounded-xl bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 shadow-2xs transition-colors shrink-0 ml-2"
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Plantilla .xlsx
                  </button>
                </div>

                {/* Upload Box */}
                <div className="p-4 bg-ranch-50/60 rounded-2xl border border-ranch-200/60 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-ranch-900 flex items-center space-x-1.5">
                      <Upload className="w-4 h-4 text-ranch-600" />
                      <span>2. Seleccionar Archivo Relleno</span>
                    </h3>
                    <p className="text-[11px] text-ranch-700/80 mt-0.5">
                      Soporta archivos .xlsx, .xls y .csv
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="inline-flex items-center px-3.5 py-2 text-xs font-bold rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white shadow-xs transition-colors shrink-0 ml-2"
                  >
                    {isProcessing ? 'Leyendo...' : 'Subir Archivo'}
                  </button>
                </div>

              </div>

              {/* Preview Table */}
              {previewRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-bold text-gray-800">Vista Previa de Carga:</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                        {validCount} válidos
                      </span>
                      {invalidCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-bold">
                          {invalidCount} con errores
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-500 font-medium">Asignar lote a todos:</span>
                      <select
                        value={selectedLotId}
                        onChange={e => setSelectedLotId(e.target.value)}
                        className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg font-medium"
                      >
                        <option value="">Sin lote específico</option>
                        {lots.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-500 uppercase sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Estado</th>
                          <th className="py-2.5 px-3">Arete</th>
                          <th className="py-2.5 px-3">Nombre</th>
                          <th className="py-2.5 px-3">Sexo</th>
                          <th className="py-2.5 px-3">Raza</th>
                          <th className="py-2.5 px-3">Etapa</th>
                          <th className="py-2.5 px-3">Propósito</th>
                          <th className="py-2.5 px-3 text-right">Peso (Kg)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {previewRows.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'hover:bg-gray-50' : 'bg-red-50/50'}>
                            <td className="py-2 px-3">
                              {row.isValid ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <span title={row.errors.join(', ')}>
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-bold text-gray-900">{row.earTagCode}</td>
                            <td className="py-2 px-3 text-gray-700">{row.name || '—'}</td>
                            <td className="py-2 px-3 capitalize">{row.gender}</td>
                            <td className="py-2 px-3 text-gray-600">{row.breedName}</td>
                            <td className="py-2 px-3 capitalize">{row.currentStage}</td>
                            <td className="py-2 px-3 capitalize">{row.purpose}</td>
                            <td className="py-2 px-3 text-right font-medium">{row.currentWeightKg || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        {importedSuccessCount === null && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {validCount > 0 ? `Listo para importar ${validCount} animales a la base de datos local` : 'Sube un archivo para comenzar'}
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={validCount === 0 || isProcessing}
                onClick={handleCommit}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-ranch-600 hover:bg-ranch-700 disabled:opacity-40 text-white shadow-xs transition-colors"
              >
                {isProcessing ? 'Guardando...' : `Confirmar e Importar (${validCount})`}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
