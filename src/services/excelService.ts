import type { Animal, LifeStage, Gender, Species, AnimalPurpose } from '../types/animal';
import { db } from '../db';
import { syncEngine } from '../sync/engine';
import { generateId } from '../utils/id';

const loadXlsx = () => import('xlsx');

export interface ImportPreviewRow {
  earTagCode: string;
  name?: string;
  electronicId?: string;
  species: Species;
  gender: Gender;
  birthDate: string;
  currentWeightKg?: number;
  currentStage: LifeStage;
  purpose: AnimalPurpose;
  breedName: string;
  isValid: boolean;
  errors: string[];
}

export function parseExcelDate(raw: unknown): string {
  if (typeof raw === 'number') {
    // Número de serie Excel (días desde 1899-12-30)
    const date = new Date(Math.round((raw - 25569) * 86400 * 1000));
    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '2022-01-01';
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const num = Number(trimmed);
    if (!isNaN(num) && num > 10000 && num < 60000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  return '2022-01-01';
}

export class ExcelService {
  // Generate a starter template Excel file for farmers
  public static async generateTemplate(): Promise<Blob> {
    const XLSX = await loadXlsx();
    const headers = [
      ['Arete / Codigo (Obligatorio)', 'Nombre', 'Chip / RFID', 'Especie (bovine/buffalo/equine/porcine/ovine)', 'Sexo (female/male/castrated)', 'Fecha Nacimiento (AAAA-MM-DD)', 'Peso Actual (Kg)', 'Etapa (calf/weaned/juvenile/adult)', 'Proposito (milk/beef/dual_purpose/breeding)', 'Raza Principal']
    ];

    const sampleRows = [
      ['HLP-501', 'Estrella', '982000412891501', 'bovine', 'female', '2022-04-10', '510', 'adult', 'milk', 'Holstein'],
      ['HLP-502', 'Gitano', '982000412891502', 'bovine', 'male', '2021-08-15', '750', 'adult', 'breeding', 'Brahman'],
      ['HLP-503', 'Novillo 503', '', 'bovine', 'castrated', '2025-01-20', '390', 'juvenile', 'beef', 'Angus Cross'],
      ['HLP-504', 'Princesa', '', 'bovine', 'female', '2023-02-12', '460', 'adult', 'dual_purpose', 'Girolando']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleRows]);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 },
      { wch: 18 },
      { wch: 20 },
      { wch: 22 },
      { wch: 18 },
      { wch: 25 },
      { wch: 16 },
      { wch: 18 },
      { wch: 24 },
      { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Ganado');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Parse uploaded Excel or CSV file
  public static async parseSpreadsheet(file: File, farmId?: string): Promise<ImportPreviewRow[]> {
    const XLSX = await loadXlsx();
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];

    // Read as 2D array
    const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    if (rawData.length < 2) return [];

    const allAnimals = await db.animals.toArray();
    const farmAnimals = farmId && farmId !== 'all' 
      ? allAnimals.filter(a => a.farmId === farmId)
      : allAnimals;

    const existingTags = new Set(farmAnimals.map(a => a.earTagCode.toLowerCase()));
    const existingRfids = new Set(
      allAnimals.filter(a => a.electronicId).map(a => a.electronicId!.toLowerCase())
    );

    const previewRows: ImportPreviewRow[] = [];

    // Skip header row
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0 || !row[0]) continue;

      const earTagCode = String(row[0] || '').trim();
      const name = row[1] ? String(row[1]).trim() : undefined;
      const electronicId = row[2] ? String(row[2]).trim() : undefined;
      const speciesRaw = String(row[3] || 'bovine').toLowerCase().trim();
      const genderRaw = String(row[4] || 'female').toLowerCase().trim();
      const birthDateRaw = row[5];
      const weightRaw = row[6] ? Number(row[6]) : undefined;
      const stageRaw = String(row[7] || 'adult').toLowerCase().trim();
      const purposeRaw = String(row[8] || 'dual_purpose').toLowerCase().trim();
      const breedName = row[9] ? String(row[9]).trim() : 'Mestizo';

      const errors: string[] = [];

      if (!earTagCode) {
        errors.push('El arete o código es obligatorio.');
      } else if (existingTags.has(earTagCode.toLowerCase())) {
        errors.push(`El arete ${earTagCode} ya existe en esta finca.`);
      }

      if (electronicId && existingRfids.has(electronicId.toLowerCase())) {
        errors.push(`El chip RFID ${electronicId} ya está registrado en la base de datos.`);
      }

      // Map gender
      let gender: Gender = 'female';
      if (genderRaw.includes('macho') || genderRaw.includes('male') || genderRaw === 'm') gender = 'male';
      else if (genderRaw.includes('castrad') || genderRaw.includes('buey') || genderRaw === 'c') gender = 'castrated';

      // Map species
      let species: Species = 'bovine';
      if (speciesRaw.includes('bufal') || speciesRaw.includes('buffalo')) species = 'buffalo';
      else if (speciesRaw.includes('equin') || speciesRaw.includes('caball')) species = 'equine';
      else if (speciesRaw.includes('cerd') || speciesRaw.includes('porcin')) species = 'porcine';
      else if (speciesRaw.includes('oveja') || speciesRaw.includes('ovin')) species = 'ovine';
      else if (speciesRaw.includes('cabra') || speciesRaw.includes('caprin')) species = 'caprine';

      // Map stage
      let currentStage: LifeStage = 'adult';
      if (stageRaw.includes('terner') || stageRaw.includes('calf')) currentStage = 'calf';
      else if (stageRaw.includes('destet') || stageRaw.includes('wean')) currentStage = 'weaned';
      else if (stageRaw.includes('levant') || stageRaw.includes('juvenil') || stageRaw.includes('novill')) currentStage = 'juvenile';

      // Map purpose
      let purpose: AnimalPurpose = 'dual_purpose';
      if (purposeRaw.includes('leche') || purposeRaw.includes('milk')) purpose = 'milk';
      else if (purposeRaw.includes('carne') || purposeRaw.includes('ceba') || purposeRaw.includes('beef')) purpose = 'beef';
      else if (purposeRaw.includes('reprod') || purposeRaw.includes('cria') || purposeRaw.includes('breed')) purpose = 'breeding';

      // Parse birth date using resilient serial + ISO converter
      const birthDate = parseExcelDate(birthDateRaw);

      previewRows.push({
        earTagCode,
        name,
        electronicId,
        species,
        gender,
        birthDate,
        currentWeightKg: weightRaw,
        currentStage,
        purpose,
        breedName,
        isValid: errors.length === 0,
        errors
      });
    }

    return previewRows;
  }

  // Commit verified rows into Dexie database
  public static async commitImport(rows: ImportPreviewRow[], farmId: string = 'default_farm', lotId?: string) {
    const validRows = rows.filter(r => r.isValid);
    if (validRows.length === 0) return 0;

    const animals: Animal[] = validRows.map(r => ({
      id: generateId('anm'),
      earTagCode: r.earTagCode,
      electronicId: r.electronicId,
      name: r.name || `Animal ${r.earTagCode}`,
      species: r.species,
      gender: r.gender,
      birthDate: r.birthDate,
      currentWeightKg: r.currentWeightKg,
      currentStage: r.currentStage,
      purpose: r.purpose,
      breedComposition: [{ breedId: 'custom', breedName: r.breedName, percentage: 100 }],
      farmId,
      lotId,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    }));

    await db.animals.bulkPut(animals);

    // Queue all imported animals in a single outbox transaction
    await syncEngine.bulkQueueActions(
      animals.map(a => ({
        entityType: 'animal' as const,
        actionType: 'create' as const,
        entityId: a.id,
        payload: a
      }))
    );

    return animals.length;
  }

  // Export current animal database to Excel
  public static async exportAnimalsToExcel(animals: Animal[]): Promise<Blob> {
    const XLSX = await loadXlsx();
    const rows = animals.map(a => ({
      'Arete / Código': a.earTagCode,
      'Nombre': a.name || '',
      'Chip / RFID': a.electronicId || '',
      'Especie': a.species,
      'Sexo': a.gender,
      'Fecha Nacimiento': a.birthDate,
      'Peso Actual (Kg)': a.currentWeightKg || '',
      'Etapa': a.currentStage,
      'Propósito': a.purpose,
      'Raza': a.breedComposition.map(b => `${b.percentage}% ${b.breedName}`).join(', '),
      'Estado': a.status,
      'Notas': a.notes || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario Ganado');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}
