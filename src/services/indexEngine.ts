import type { FareObservation, IndexPoint, IndexCalculationOptions, LeadTimeDays } from '@/types/airfare.ts';
import routeWeightsData from '@/data/fixtures/routeWeights.json';

/**
 * =========================================================================================
 * AIRFARE PRICE INDEX (APIx) ENGINE
 * =========================================================================================
 * METHODOLOGY:
 * This engine calculates a chain-linked, passenger-weighted geometric mean index.
 * It is NOT a Jevons index (which is an unweighted geometric mean of elementary price relatives),
 * and it is NOT a simple arithmetic or Carli/Dutot index.
 *
 * For each route r and each lead-time window lt, consecutive observation days (t-1 to t) are
 * compared via price relatives:
 *   relative_{r, lt} = totalFare_{r, lt}(t) / totalFare_{r, lt}(t-1)
 *
 * Across all valid lead times for route r, the unweighted geometric mean gives the route relative:
 *   ln(relative_r) = (1 / K_r) * sum_{lt} ln(relative_{r, lt})
 *
 * Route-level relatives are then aggregated into period-over-period index changes via a
 * PASSENGER-WEIGHTED GEOMETRIC MEAN across active routes:
 *   periodIndexChange = exp( sum(weight_r * ln(relative_r)) / sum(weight_r) )
 *
 * The series is chain-linked sequentially across all observation dates:
 *   indexValue(0) = 100.00 (base period)
 *   indexValue(t) = indexValue(t-1) * periodIndexChange
 *
 * ZERO-FARE & SOLD-OUT EXCLUSION:
 * Sold-out observations (status === 'sold_out' or totalFare <= 0) have no transaction price
 * to compare and are excluded from the relative calculations without removing them from the
 * underlying dataset.
 *
 * ANOMALY HANDLING:
 * Statistical price anomalies flagged by IQR are included by default, but can be toggled off
 * via options.excludeAnomalies.
 *
 * WEIGHTS NOTICE:
 * Route weights: DGCA domestic city-pair traffic, December 2025 (two-way passenger volume).
 * Sourced from DGCA Monthly Statistics (Domestic Air Transport) via github.com/Vonter/india-aviation-traffic (ODbL).
 * Weights are loaded from /src/data/fixtures/routeWeights.json and normalized to sum to 1.0.
 * =========================================================================================
 */

export const DGCA_WEIGHTS_DISCLAIMER =
  'Route weights: DGCA domestic city-pair traffic, December 2025';
export const DGCA_WEIGHTS_NOTE =
  '(most recent month with complete data for these routes)';

export interface RouteWeightsConfig {
  _comment?: string;
  label: string;
  source: string;
  note: string;
  passengers?: Record<string, number>;
  weights: Record<string, number>;
}

const ALL_LEAD_TIMES: readonly LeadTimeDays[] = [1, 7, 15, 30, 45];
const CANONICAL_ROUTES = ['DEL-BOM', 'DEL-BLR', 'BOM-BLR'] as const;

/**
 * Returns the configured DGCA passenger-volume weights per route.
 */
export function getRouteWeights(): Record<string, number> {
  const raw = routeWeightsData as RouteWeightsConfig;
  return { ...raw.weights };
}

/**
 * Computes a single price relative between two consecutive observations for a specific route and lead time.
 * Returns null if either observation is invalid, sold_out, or excluded by anomaly options.
 */
export function computePriceRelative(
  prevObs: FareObservation | undefined,
  currObs: FareObservation | undefined,
  options?: IndexCalculationOptions
): number | null {
  if (!prevObs || !currObs) return null;
  if (prevObs.status === 'sold_out' || currObs.status === 'sold_out') return null;
  if (prevObs.totalFare <= 0 || currObs.totalFare <= 0) return null;

  if (options?.excludeAnomalies) {
    if (prevObs.isAnomaly || currObs.isAnomaly) {
      return null;
    }
  }

  return currObs.totalFare / prevObs.totalFare;
}

/**
 * Calculates the complete chain-linked, passenger-weighted geometric mean index series.
 */
export function calculateAirfareIndex(
  observations: FareObservation[],
  options?: IndexCalculationOptions
): IndexPoint[] {
  const weights = getRouteWeights();
  
  // Guarantee deterministic route iteration in canonical order
  const routeEntries = CANONICAL_ROUTES.map((route) => [route, weights[route] ?? 0] as const);

  // Log weight table as specified in requirements:
  // "[AeroStat] Route weights (DGCA Dec 2025): DEL-BOM=0.4402, DEL-BLR=0.3161, BOM-BLR=0.2437"
  const weightsLogString = routeEntries
    .map(([route, w]) => `${route}=${w.toFixed(4)}`)
    .join(', ');
  console.log(`[AeroStat] Route weights (DGCA Dec 2025): ${weightsLogString}`);

  if (!observations || observations.length === 0) {
    console.warn('[AeroStat] Index calculation aborted: observations list is empty');
    return [];
  }

  // Extract all unique sorted observation dates (YYYY-MM-DD) deterministically
  const uniqueDates = Array.from(
    new Set(observations.map((o) => o.observedAt.slice(0, 10)))
  ).sort((a, b) => a.localeCompare(b));

  if (uniqueDates.length === 0) {
    return [];
  }

  // Build fast lookup map: key = `${date}_${origin}-${destination}_${leadTimeDays}`
  const observationMap = new Map<string, FareObservation>();
  for (const obs of observations) {
    const dateKey = obs.observedAt.slice(0, 10);
    const routeKey = `${obs.origin.toUpperCase()}-${obs.destination.toUpperCase()}`;
    const key = `${dateKey}_${routeKey}_${obs.leadTimeDays}`;
    observationMap.set(key, obs);
  }

  const series: IndexPoint[] = [];

  // Base period (t=0) is strictly defined from fixture min date (uniqueDates[0])
  let runningIndex = 100.0;
  series.push({
    date: uniqueDates[0],
    indexValue: 100.0,
    baseValue: 100,
  });

  // Chain-link across each consecutive day pair
  for (let t = 1; t < uniqueDates.length; t++) {
    const prevDate = uniqueDates[t - 1];
    const currDate = uniqueDates[t];

    let weightedLogSum = 0;
    let activeWeightSum = 0;

    for (const [route, weight] of routeEntries) {
      const logRelatives: number[] = [];

      for (const lt of ALL_LEAD_TIMES) {
        const prevObs = observationMap.get(`${prevDate}_${route}_${lt}`);
        const currObs = observationMap.get(`${currDate}_${route}_${lt}`);

        const relative = computePriceRelative(prevObs, currObs, options);
        if (relative !== null && relative > 0) {
          logRelatives.push(Math.log(relative));
        }
      }

      if (logRelatives.length === 0) {
        console.warn(
          `[AeroStat] Skipping route ${route} for period ${currDate}: zero valid (non-sold-out) observations available`
        );
        continue;
      }

      // Unweighted geometric mean of lead-time relatives for this route
      const routeLogRelative =
        logRelatives.reduce((acc, val) => acc + val, 0) / logRelatives.length;

      weightedLogSum += weight * routeLogRelative;
      activeWeightSum += weight;
    }

    if (activeWeightSum > 0) {
      // Period index change = exp( sum(weight_r * ln(relative_r)) / sum(weight_r) )
      const periodIndexChange = Math.exp(weightedLogSum / activeWeightSum);
      runningIndex = runningIndex * periodIndexChange;
    } else {
      console.warn(
        `[AeroStat] No active route weights found for period ${currDate}; carrying forward previous index value`
      );
    }

    series.push({
      date: currDate,
      indexValue: Number(runningIndex.toFixed(2)),
      baseValue: 100,
    });
  }

  const currentVal = series[series.length - 1].indexValue;
  console.log(
    `[AeroStat] Index computed: ${series.length} periods, base=100, current=${currentVal.toFixed(2)}, method=chain-linked weighted geometric mean`
  );

  return series;
}
