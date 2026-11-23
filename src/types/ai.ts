export type AiMode = 'auto' | 'farm_local' | 'external_consultant';

export interface AiMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  mode?: 'farm_local' | 'external_consultant';
  dataCard?: {
    type: 'reproduction_alert' | 'weight_gain_analysis' | 'financial_summary' | 'health_alert' | 'external_reference';
    title: string;
    metrics: { label: string; value: string | number }[];
    actionLabel?: string;
  };
}

export interface HerdAnalysisSnapshot {
  totalAnimals: number;
  femalesCount: number;
  malesCount: number;
  milkingCowsCount: number;
  pregnantCowsCount: number;
  dryCowsCount: number;
  avgDailyMilkLiters: number;
  avgAdgKg: number;
  upcomingCalvingsCount: number;
  pendingDryOffCount: number;
  activeQuarantinesCount: number;
  monthlyNetProfit: number;
}
