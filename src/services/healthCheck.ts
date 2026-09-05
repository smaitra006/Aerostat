import type { FareObservation, DataQualityReport, IndexPoint } from '@/types/airfare.ts';
import { loadObservations, getDataQualityReport, getIndexSeries } from '@/services/dataStore.ts';
import { getRouteWeights } from '@/services/indexEngine.ts';
import rawFixtureData from '@/data/fixtures/sampleObservations.json';

export interface HealthCheckItem {
  name: string;
  passed: boolean;
  detail: string;
}

export interface PipelineHealthResult {
  healthy: boolean;
  timestamp: string;
  checks: HealthCheckItem[];
}

export interface HealthCheckInput {
  observations?: FareObservation[];
  rawObservationsCount?: number;
  duplicateCount?: number;
  expectedObservationsCount?: number;
  dataQualityReport?: DataQualityReport;
  indexSeries?: IndexPoint[];
  routeWeights?: Record<string, number>;
}

export const KNOWN_FIXTURE_DUPLICATES = 3;

/**
 * Re-verifies all critical pipeline invariants at runtime against loaded data:
 * 1. Observation count matches raw fixtures minus known duplicates (e.g. 449 - 3 = 446)
 * 2. Data Quality Score is a valid number within [0, 100]
 * 3. Index series has exactly 30 consecutive daily periods with base anchored strictly at 100.00
 * 4. Route weights sum to 1.0 (within 0.001 tolerance)
 *
 * Accepts optional injectable data for unit testing with constructed failure cases.
 */
export function runPipelineHealthCheck(input?: HealthCheckInput): PipelineHealthResult {
  const timestamp = new Date().toISOString();
  const checks: HealthCheckItem[] = [];

  // --- 1. OBSERVATIONS COUNT INVARIANT ---
  const observations = input?.observations ?? loadObservations();
  const rawCount =
    input?.rawObservationsCount ??
    (Array.isArray(rawFixtureData) ? rawFixtureData.length : 449);
  const duplicateCount = input?.duplicateCount ?? KNOWN_FIXTURE_DUPLICATES;
  const expectedObsCount =
    input?.expectedObservationsCount ?? (rawCount - duplicateCount);
  const actualObsCount = observations.length;
  const obsCountPassed = actualObsCount === expectedObsCount;

  checks.push({
    name: 'Observation Count & Deduplication',
    passed: obsCountPassed,
    detail: obsCountPassed
      ? `Loaded ${actualObsCount} observations (matches expected ${expectedObsCount}: ${rawCount} raw minus ${duplicateCount} duplicates).`
      : `Observation count mismatch: expected ${expectedObsCount} (${rawCount} raw minus ${duplicateCount} duplicates), but got ${actualObsCount}.`,
  });

  // --- 2. DATA QUALITY SCORE (DQS) INVARIANT ---
  const dqsReport = input?.dataQualityReport ?? getDataQualityReport();
  const score = dqsReport?.score;
  const isScoreValid =
    typeof score === 'number' && !Number.isNaN(score) && score >= 0 && score <= 100;

  checks.push({
    name: 'Data Quality Score Range',
    passed: isScoreValid,
    detail: isScoreValid
      ? `DQS score is ${score.toFixed(2)}/100 (valid range: 0 to 100).`
      : `Invalid DQS score: ${score === undefined ? 'undefined' : score} (must be numeric between 0 and 100).`,
  });

  // --- 3. INDEX CONTINUITY & BASE PERIOD INVARIANT ---
  const series = input?.indexSeries ?? getIndexSeries();
  const has30Periods = series.length === 30;
  const basePoint = series.length > 0 ? series[0] : null;
  const baseAnchored =
    basePoint !== null &&
    typeof basePoint.indexValue === 'number' &&
    Math.abs(basePoint.indexValue - 100.0) < 0.0001;

  // Check consecutive date continuity
  let gapCount = 0;
  for (let i = 1; i < series.length; i++) {
    const prevTime = Date.parse(`${series[i - 1].date}T00:00:00Z`);
    const currTime = Date.parse(`${series[i].date}T00:00:00Z`);
    const diffDays = Math.round((currTime - prevTime) / 86400000);
    if (diffDays !== 1) {
      gapCount++;
    }
  }
  const isContinuous = gapCount === 0;
  const indexPassed = has30Periods && baseAnchored && isContinuous;

  const indexDetails: string[] = [];
  if (!has30Periods) {
    indexDetails.push(`period count = ${series.length} (expected 30)`);
  }
  if (!baseAnchored) {
    indexDetails.push(
      `base period = ${basePoint ? basePoint.indexValue : 'null'} (expected 100.00)`
    );
  }
  if (!isContinuous) {
    indexDetails.push(`${gapCount} date continuity gap(s) found`);
  }

  checks.push({
    name: 'Index Series 30-Day Continuity & Base Anchor',
    passed: indexPassed,
    detail: indexPassed
      ? `Index series has 30 consecutive periods with base period anchored at ${basePoint?.indexValue.toFixed(2)} on ${basePoint?.date}.`
      : `Index series invariant failure: ${indexDetails.join('; ')}.`,
  });

  // --- 4. ROUTE WEIGHTS NORMALIZATION INVARIANT ---
  const weights = input?.routeWeights ?? getRouteWeights();
  const weightValues = Object.values(weights || {});
  const weightSum = weightValues.reduce((sum, val) => sum + val, 0);
  const weightsNormalized =
    weightValues.length > 0 && Math.abs(weightSum - 1.0) <= 0.001;

  checks.push({
    name: 'Route Weights Normalization',
    passed: weightsNormalized,
    detail: weightsNormalized
      ? `Route weights sum to ${weightSum.toFixed(4)} across ${weightValues.length} routes (within 0.001 tolerance of 1.0000).`
      : `Route weights sum to ${weightSum.toFixed(4)}, which violates the 1.0 ± 0.001 normalization invariant.`,
  });

  const healthy = checks.every((c) => c.passed);

  return {
    healthy,
    timestamp,
    checks,
  };
}
