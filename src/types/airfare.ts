export type LeadTimeDays = 1 | 7 | 15 | 30 | 45;

export type FareStatus = 'available' | 'sold_out';

export interface FareObservation {
  id: string;
  origin: string; // IATA (e.g. "DEL")
  destination: string; // IATA (e.g. "BOM")
  carrier: string;
  observedAt: string; // ISO date string
  leadTimeDays: LeadTimeDays;
  fareClass: string;
  baseFare: number;
  taxes: number;
  totalFare: number;
  source: string; // e.g. "fixture:indigo"
  status: FareStatus;
  isAnomaly?: boolean;
}

export interface DataQualityReport {
  totalObservations: number;
  soldOutCount: number;
  anomalyCount: number;
  missingFieldWarnings: number;
  score: number;
  deductions: {
    soldOutDeduction: number;
    anomalyDeduction: number;
    missingFieldDeduction: number;
  };
}

export interface Route {
  origin: string;
  destination: string;
  label: string; // e.g. "DEL-BOM"
}

export interface IndexPoint {
  date: string;
  indexValue: number;
  baseValue: 100;
}

export interface IndexCalculationOptions {
  excludeAnomalies?: boolean;
}
