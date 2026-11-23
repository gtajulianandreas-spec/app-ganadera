import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  HardDrive
} from 'lucide-react';
import { createFullBackup, downloadBackupFile, restoreFromBackup } from '../../db/backup';
import { db } from '../../db';
import type { BackupMetadata } from '../../types/sync';

interface BackupRestoreModalProps {
  onClose: () => void;
  onRestored: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  onClose,
  onRestored
}) => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadBackups() {
      const list = await db.backups.reverse().toArray();
      setBackups(list);
    }
    loadBackups();
  }, []);

  const handleCreateAndDownload = async () => {
    setIsExporting(true);
    try {
      const blob = await createFullBackup('Respaldo manual desde panel de control');
      downloadBackupFile(blob, 'Hacienda_La_Pradera');
      setStatusMessage('Respaldo generado y descargado correctamente en tu equipo.');
      const list = await db.backups.reverse().toArray();
      setBackups(list);
    } catch (err: any) {
      setStatusMessage('Error generando el respaldo: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('¿Estás seguro de restaurar este respaldo? Reemplazará los datos actuales por los contenidos en la copia.')) {
      return;
    }

    const res = await restoreFromBackup(file);
    setStatusMessage(res.message);
    if (res.success) {
      setTimeout(() => {
        onRestored();
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Guardado Automático y Respaldos</h2>
              <p className="text-xs text-gray-500">Garantía de cero pérdida de datos en campo o escritorio</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {statusMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Autosave Banner */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-emerald-900">Guardado Local Activo (Zero-Data-Loss)</h3>
              <p className="text-emerald-700 mt-0.5 leading-relaxed">
                Cada pesaje, ordeño, nacimiento o dosis se persiste al instante en el motor IndexedDB transaccional de tu dispositivo. No dependes de conexión a Internet para que tus datos queden asegurados.
              </p>
            </div>
          </div>

          {/* Action Boxes */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Export Button */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col justify-between space-y-3">
              <div>
                <span className="font-bold text-gray-900 block">Exportar Copia (.backup)</span>
                <span className="text-gray-500 text-[11px] block mt-0.5">
                  Guarda un archivo completo con animales, pesajes y finanzas en tu disco o USB.
                </span>
              </div>
              <button
                onClick={handleCreateAndDownload}
                disabled={isExporting}
                className="w-full inline-flex items-center justify-center px-3 py-2 font-bold rounded-xl bg-ranch-600 hover:bg-ranch-700 text-white shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {isExporting ? 'Generando...' : 'Descargar Backup'}
              </button>
            </div>

            {/* Restore Button */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col justify-between space-y-3">
              <div>
                <span className="font-bold text-gray-900 block">Restaurar Copia</span>
                <span className="text-gray-500 text-[11px] block mt-0.5">
                  Recupera tu hato completo desde un archivo previamente exportado.
                </span>
              </div>
              <input 
                ref={fileInputRef}
                type="file"
                accept=".backup,.json"
                className="hidden"
                onChange={handleRestoreFile}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center px-3 py-2 font-bold rounded-xl bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 shadow-2xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                Cargar Archivo
              </button>
            </div>

          </div>

          {/* Backups History */}
          <div>
            <span className="font-bold text-gray-900 block mb-2">Historial de Respaldos Recientes</span>
            {backups.length === 0 ? (
              <p className="text-gray-400 italic">No has generado respaldos manuales todavía.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {backups.map(b => (
                  <div key={b.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-3.5 h-3.5 text-gray-400" />
                      <div>
                        <span className="font-bold text-gray-800">{new Date(b.timestamp).toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 block">{b.description}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-600 text-[11px]">
                      {b.animalCount} animales ({(b.fileSizeBytes / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
