import type { Animal } from '../types/animal';
import type { HealthRecord } from '../types/production';
import type { ReproductionEvent } from '../types/reproduction';
import type { SmartAlertItem } from '../components/alerts/SmartAlertsModal';
import type { StageTransitionCandidate } from './stageTransitionEngine';

export interface SmartAlertsInput {
  healthRecords: HealthRecord[];
  reproEvents: ReproductionEvent[];
  stageCandidates: StageTransitionCandidate[];
  animalMap: Map<string, Animal>;
  todayStr?: string;
  next15DaysStr?: string;
}

/**
 * Computes unified farm alerts (pharmacological withdrawals, mandatory dry-off,
 * imminent calvings, and life-stage transitions) as a pure deterministic function.
 */
export function computeSmartAlerts(input: SmartAlertsInput): SmartAlertItem[] {
  const todayStr = input.todayStr ?? new Date().toISOString().split('T')[0];
  const next15DaysStr =
    input.next15DaysStr ??
    (() => {
      const d = new Date(todayStr + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + 15);
      return d.toISOString().split('T')[0];
    })();

  const list: SmartAlertItem[] = [];

  // 1. Health / Withdrawal alerts
  for (const h of input.healthRecords) {
    const a = input.animalMap.get(h.animalId);
    if (h.safeMilkDate && h.safeMilkDate >= todayStr) {
      list.push({
        id: 'alt_milk_' + h.id,
        category: 'withdrawal',
        severity: 'critical',
        title: 'Leche en Retiro Farmacológico',
        subtitle: `Tratamiento con ${h.treatmentName}. No enviar al tanque comunal.`,
        animalTag: a?.earTagCode || h.animalId,
        animalName: a?.name,
        dateOrDays: `Libre de fármaco el: ${h.safeMilkDate}`,
        targetTab: 'health'
      });
    }
    if (h.safeMeatDate && h.safeMeatDate >= todayStr) {
      list.push({
        id: 'alt_meat_' + h.id,
        category: 'withdrawal',
        severity: 'critical',
        title: 'Restricción de Faena para Carne',
        subtitle: `Tratamiento con ${h.treatmentName}. Tiempo de carencia activo para beneficio.`,
        animalTag: a?.earTagCode || h.animalId,
        animalName: a?.name,
        dateOrDays: `Apta el: ${h.safeMeatDate}`,
        targetTab: 'health'
      });
    }
  }

  // 2. Dry-off alerts
  for (const r of input.reproEvents) {
    if (r.pregnancyResult === 'pregnant' && r.mandatoryDryOffDate && r.mandatoryDryOffDate <= next15DaysStr) {
      const a = input.animalMap.get(r.animalId);
      const isOverdue = r.mandatoryDryOffDate < todayStr;
      list.push({
        id: 'alt_dry_' + r.id,
        category: 'dry_off',
        severity: isOverdue ? 'critical' : 'warning',
        title: isOverdue ? '¡Secado de Vaca Vencido!' : 'Secado Obligatorio Próximo',
        subtitle: 'Vaca preñada debe cesar ordeño y recibir terapia intramamaria (60 días preparto).',
        animalTag: a?.earTagCode || r.animalId,
        animalName: a?.name,
        dateOrDays: `Fecha límite: ${r.mandatoryDryOffDate}`,
        targetTab: 'reproduction'
      });
    }
  }

  // 3. Calving alerts
  for (const r of input.reproEvents) {
    if (r.pregnancyResult === 'pregnant' && r.projectedCalvingDate && r.projectedCalvingDate <= next15DaysStr) {
      const a = input.animalMap.get(r.animalId);
      list.push({
        id: 'alt_calv_' + r.id,
        category: 'calving',
        severity: 'warning',
        title: 'Parto Inminente (< 15 días)',
        subtitle: 'Trasladar a potrero de maternidad para asistencia 24h y suplementación preparto.',
        animalTag: a?.earTagCode || r.animalId,
        animalName: a?.name,
        dateOrDays: `Parto proyectado: ${r.projectedCalvingDate}`,
        targetTab: 'reproduction'
      });
    }
  }

  // 4. Life stage transitions
  for (const c of input.stageCandidates) {
    list.push({
      id: 'alt_trans_' + c.animal.id,
      category: 'transition',
      severity: 'info',
      title: 'Transición de Etapa Lista',
      subtitle: c.reason,
      animalTag: c.animal.earTagCode,
      animalName: c.animal.name,
      dateOrDays: `${c.ageMonths} meses cumplidos`,
      targetTab: 'animals'
    });
  }

  return list;
}
