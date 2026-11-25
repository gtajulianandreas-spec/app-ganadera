import { db } from './index';
import type { BackupMetadata } from '../types/sync';

export async function createFullBackup(description: string = 'Respaldo manual'): Promise<Blob> {
  const [
    farms,
    animals,
    lots,
    pastures,
    reproductionEvents,
    milkingRecords,
    weightRecords,
    healthRecords,
    financialRecords,
    settings
  ] = await Promise.all([
    db.farms.toArray(),
    db.animals.toArray(),
    db.lots.toArray(),
    db.pastures.toArray(),
    db.reproductionEvents.toArray(),
    db.milkingRecords.toArray(),
    db.weightRecords.toArray(),
    db.healthRecords.toArray(),
    db.financialRecords.toArray(),
    db.settings.toArray()
  ]);

  const backupData = {
    metadata: {
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      description,
      app: 'APP GANADERA'
    },
    tables: {
      farms,
      animals,
      lots,
      pastures,
      reproductionEvents,
      milkingRecords,
      weightRecords,
      healthRecords,
      financialRecords,
      settings
    }
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });

  // Record backup entry in db
  const backupMeta: BackupMetadata = {
    id: 'bak_' + Date.now(),
    timestamp: Date.now(),
    animalCount: animals.length,
    recordsCount:
      animals.length +
      reproductionEvents.length +
      milkingRecords.length +
      weightRecords.length +
      financialRecords.length,
    fileSizeBytes: blob.size,
    appVersion: '1.0.0',
    description
  };
  await db.backups.put(backupMeta);

  return blob;
}

export function downloadBackupFile(blob: Blob, farmName: string = 'Hacienda') {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `Respaldo_${farmName.replace(/\s+/g, '_')}_${dateStr}.ganado.backup`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function restoreFromBackup(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.tables || !data.metadata || data.metadata.app !== 'APP GANADERA') {
      throw new Error('El archivo seleccionado no es un respaldo válido de APP GANADERA');
    }

    // Atomic transaction for restoring all tables
    await db.transaction('rw', [
      db.farms,
      db.animals,
      db.lots,
      db.pastures,
      db.reproductionEvents,
      db.milkingRecords,
      db.weightRecords,
      db.healthRecords,
      db.financialRecords,
      db.settings
    ], async () => {
      // Clear existing
      await Promise.all([
        db.farms.clear(),
        db.animals.clear(),
        db.lots.clear(),
        db.pastures.clear(),
        db.reproductionEvents.clear(),
        db.milkingRecords.clear(),
        db.weightRecords.clear(),
        db.healthRecords.clear(),
        db.financialRecords.clear()
      ]);

      // Bulk restore
      if (data.tables.farms?.length) await db.farms.bulkPut(data.tables.farms);
      if (data.tables.animals?.length) await db.animals.bulkPut(data.tables.animals);
      if (data.tables.lots?.length) await db.lots.bulkPut(data.tables.lots);
      if (data.tables.pastures?.length) await db.pastures.bulkPut(data.tables.pastures);
      if (data.tables.reproductionEvents?.length) await db.reproductionEvents.bulkPut(data.tables.reproductionEvents);
      if (data.tables.milkingRecords?.length) await db.milkingRecords.bulkPut(data.tables.milkingRecords);
      if (data.tables.weightRecords?.length) await db.weightRecords.bulkPut(data.tables.weightRecords);
      if (data.tables.healthRecords?.length) await db.healthRecords.bulkPut(data.tables.healthRecords);
      if (data.tables.financialRecords?.length) await db.financialRecords.bulkPut(data.tables.financialRecords);
      if (data.tables.settings?.length) await db.settings.bulkPut(data.tables.settings);
    });

    return {
      success: true,
      message: `Respaldo restaurado con éxito. Se recuperaron ${data.tables.animals?.length || 0} animales.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error al procesar el archivo de respaldo'
    };
  }
}
