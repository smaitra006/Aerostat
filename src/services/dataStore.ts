import type { FareObservation, LeadTimeDays, FareStatus, DataQualityReport, IndexPoint, IndexCalculationOptions } from '@/types/airfare.ts';
import { normalizeObservation, deduplicateObservations } from '@/services/normalize.ts';
import { flagAnomalies } from '@/services/anomalyDetection.ts';
import { computeDataQualityScore } from '@/services/dataQuality.ts';
import { calculateAirfareIndex } from '@/services/indexEngine.ts';
import rawFixtureData from '@/data/fixtures/sampleObservations.json';

const VALID_LEAD_TIMES: readonly LeadTimeDays[] = [1, 7, 15, 30, 45];
const VALID_STATUSES: readonly FareStatus[] = ['available', 'sold_out'];

let cachedObservations: FareObservation[] | null = null;
let cachedQualityReport: DataQualityReport | null = null;
let cachedCanonicalIndexSeries: IndexPoint[] | null = null;

export interface SectorCellData {
  route: string;
  leadTimeDays: LeadTimeDays;
  averageFare: number | null;
  count: number;
  soldOutCount: number;
  totalSum: number;
}

export interface SectorAggregations {
  routes: readonly string[];
  leadTimes: readonly LeadTimeDays[];
  matrix: Record<string, Record<LeadTimeDays, SectorCellData>>;
  flatList: SectorCellData[];
  totalSoldOutExcluded: number;
  minFare: number;
  maxFare: number;
}

export interface ElasticityDataPoint {
  leadTimeDays: LeadTimeDays;
  leadTimeLabel: string;
  'DEL-BOM': number | null;
  'DEL-BLR': number | null;
  'BOM-BLR': number | null;
}

let cachedSectorAggregations: SectorAggregations | null = null;
let cachedElasticitySeries: ElasticityDataPoint[] | null = null;

/**
 * Type guard to validate whether an unknown record matches the FareObservation contract.
 */
function isValidFareObservation(record: unknown): record is FareObservation {
  if (!record || typeof record !== 'object') {
    return false;
  }

  const r = record as Partial<FareObservation>;

  if (typeof r.id !== 'string' || r.id.trim() === '') return false;
  if (typeof r.origin !== 'string' || r.origin.trim().length !== 3) return false;
  if (typeof r.destination !== 'string' || r.destination.trim().length !== 3) return false;
  if (typeof r.carrier !== 'string' || r.carrier.trim() === '') return false;
  if (typeof r.observedAt !== 'string' || isNaN(Date.parse(r.observedAt))) return false;
  if (!VALID_LEAD_TIMES.includes(r.leadTimeDays as LeadTimeDays)) return false;
  if (typeof r.fareClass !== 'string' || r.fareClass.trim() === '') return false;
  if (typeof r.baseFare !== 'number' || isNaN(r.baseFare) || r.baseFare < 0) return false;
  if (typeof r.taxes !== 'number' || isNaN(r.taxes) || r.taxes < 0) return false;
  if (typeof r.totalFare !== 'number' || isNaN(r.totalFare) || r.totalFare < 0) return false;
  if (typeof r.source !== 'string' || r.source.trim() === '') return false;
  if (!VALID_STATUSES.includes(r.status as FareStatus)) return false;

  return true;
}

/**
 * Loads raw fixture records, filters out malformed ones with a console.warn,
 * normalizes valid records, deduplicates identical observations, runs anomaly detection,
 * and computes the Data Quality Score (DQS).
 *
 * Emits the exact expected log line:
 * "[AeroStat] Raw records: X, After normalization+dedup: Y (Z duplicates removed)"
 */
export function loadObservations(): FareObservation[] {
  if (cachedObservations) {
    return cachedObservations;
  }

  if (!Array.isArray(rawFixtureData)) {
    console.warn('[AeroStat] Fixture data is not an array:', rawFixtureData);
    return [];
  }

  const validObservations: FareObservation[] = [];

  for (let i = 0; i < rawFixtureData.length; i++) {
    const candidate = rawFixtureData[i];
    const candidateId =
      candidate && typeof candidate === 'object' && 'id' in candidate
        ? String((candidate as { id: unknown }).id)
        : `index_${i}`;

    if (isValidFareObservation(candidate)) {
      validObservations.push(candidate);
    } else {
      console.warn(
        `[AeroStat] Skipped invalid fixture record (id: ${candidateId}) - record does not conform to FareObservation schema.`,
        candidate
      );
    }
  }

  const rawCount = validObservations.length;
  const normalized = validObservations.map(normalizeObservation);
  const deduplicated = deduplicateObservations(normalized);
  const duplicatesRemoved = rawCount - deduplicated.length;

  console.log(
    `[AeroStat] Raw records: ${rawCount}, After normalization+dedup: ${deduplicated.length} (${duplicatesRemoved} duplicates removed)`
  );

  // Anomaly detection (flags IQR outliers without dropping)
  const flagged = flagAnomalies(deduplicated);

  // Compute Data Quality Score (DQS)
  const qualityReport = computeDataQualityScore(flagged);

  cachedObservations = flagged;
  cachedQualityReport = qualityReport;

  return flagged;
}

/**
 * Returns the computed DataQualityReport.
 * If loadObservations has not yet been called, invokes it to compute the report.
 */
export function getDataQualityReport(): DataQualityReport {
  if (!cachedQualityReport) {
    loadObservations();
  }
  return cachedQualityReport!;
}

/**
 * Computes and returns the chain-linked, passenger-weighted geometric mean index series.
 * Canonical calculations are memoized so subsequent calls within the session are fully deterministic.
 */
export function getIndexSeries(options?: IndexCalculationOptions): IndexPoint[] {
  const isCanonical = !options || Object.keys(options).length === 0 || options.excludeAnomalies === false;
  if (isCanonical && cachedCanonicalIndexSeries) {
    return cachedCanonicalIndexSeries;
  }

  const observations = loadObservations();
  const series = calculateAirfareIndex(observations, options);
  if (isCanonical) {
    cachedCanonicalIndexSeries = series;
  }
  return series;
}

const CANONICAL_SECTOR_ROUTES = ['DEL-BOM', 'DEL-BLR', 'BOM-BLR'] as const;
const CANONICAL_LEAD_TIMES: readonly LeadTimeDays[] = [1, 7, 15, 30, 45];

/**
 * Computes average totalFare by route and leadTimeDays, strictly excluding sold_out (totalFare = 0) observations.
 * Results are memoized for session determinism.
 */
export function getAverageFareByRouteAndLeadTime(): SectorAggregations {
  if (cachedSectorAggregations) {
    return cachedSectorAggregations;
  }

  const observations = loadObservations();
  const matrix: Record<string, Record<LeadTimeDays, SectorCellData>> = {};

  for (const route of CANONICAL_SECTOR_ROUTES) {
    matrix[route] = {} as Record<LeadTimeDays, SectorCellData>;
    for (const lt of CANONICAL_LEAD_TIMES) {
      matrix[route][lt] = {
        route,
        leadTimeDays: lt,
        averageFare: null,
        count: 0,
        soldOutCount: 0,
        totalSum: 0,
      };
    }
  }

  let totalSoldOutExcluded = 0;

  for (const obs of observations) {
    const route = `${obs.origin}-${obs.destination}`;
    if (!matrix[route] || !matrix[route][obs.leadTimeDays]) {
      continue;
    }

    const cell = matrix[route][obs.leadTimeDays];
    if (obs.status === 'sold_out' || obs.totalFare === 0) {
      cell.soldOutCount++;
      totalSoldOutExcluded++;
    } else {
      cell.totalSum += obs.totalFare;
      cell.count++;
    }
  }

  const flatList: SectorCellData[] = [];
  let minFare = Number.POSITIVE_INFINITY;
  let maxFare = Number.NEGATIVE_INFINITY;

  for (const route of CANONICAL_SECTOR_ROUTES) {
    for (const lt of CANONICAL_LEAD_TIMES) {
      const cell = matrix[route][lt];
      if (cell.count > 0) {
        cell.averageFare = Math.round((cell.totalSum / cell.count) * 100) / 100;
        if (cell.averageFare < minFare) minFare = cell.averageFare;
        if (cell.averageFare > maxFare) maxFare = cell.averageFare;
      } else {
        cell.averageFare = null;
      }
      flatList.push(cell);
    }
  }

  console.log(
    `[AeroStat] Heatmap: ${CANONICAL_SECTOR_ROUTES.length} routes x ${CANONICAL_LEAD_TIMES.length} lead-time buckets, ${totalSoldOutExcluded} cells excluded (sold-out)`
  );

  cachedSectorAggregations = {
    routes: CANONICAL_SECTOR_ROUTES,
    leadTimes: CANONICAL_LEAD_TIMES,
    matrix,
    flatList,
    totalSoldOutExcluded,
    minFare: isFinite(minFare) ? minFare : 0,
    maxFare: isFinite(maxFare) ? maxFare : 0,
  };

  return cachedSectorAggregations;
}

/**
 * Returns lead-time elasticity series for charting average fare across advance booking windows.
 */
export function getElasticitySeries(): ElasticityDataPoint[] {
  if (cachedElasticitySeries) {
    return cachedElasticitySeries;
  }

  const { matrix, leadTimes, routes } = getAverageFareByRouteAndLeadTime();

  const series: ElasticityDataPoint[] = leadTimes.map((lt) => {
    return {
      leadTimeDays: lt,
      leadTimeLabel: `${lt}d`,
      'DEL-BOM': matrix['DEL-BOM'][lt].averageFare,
      'DEL-BLR': matrix['DEL-BLR'][lt].averageFare,
      'BOM-BLR': matrix['BOM-BLR'][lt].averageFare,
    };
  });

  console.log(`[AeroStat] Elasticity: ${routes.length} routes, ${leadTimes.length} lead-time points each`);

  cachedElasticitySeries = series;
  return series;
}

