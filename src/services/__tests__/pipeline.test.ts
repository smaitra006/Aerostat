import { describe, it, expect } from 'vitest';
import {
  loadObservations,
  getIndexSeries,
  getDataQualityReport,
} from '../dataStore.ts';
import { computeDataQualityScore } from '../dataQuality.ts';
import {
  validateBasePeriod,
  validatePeriodJumps,
  validateDateContinuity,
  runMethodologyValidation,
} from '../validation.ts';
import {
  simulateGetCurrentIndex,
  simulateGetIndexSeries,
  simulateGetRouteQuality,
} from '../apiContract.ts';
import { runPipelineHealthCheck } from '../healthCheck.ts';
import { generateVerifiedSnapshot } from '../snapshotExport.ts';

describe('AeroStat Data Pipeline & Store', () => {
  it('loads normalized observations and removes duplicates', () => {
    const observations = loadObservations();
    expect(observations.length).toBe(446);
  });

  it('detects 19 price anomalies across route/lead-time clusters', () => {
    const observations = loadObservations();
    const anomalies = observations.filter((o) => o.isAnomaly);
    expect(anomalies.length).toBe(19);
  });

  it('computes expected Data Quality Score (DQS)', () => {
    const observations = loadObservations();
    const dqs = computeDataQualityScore(observations);
    expect(dqs.score).toBe(99.18);
    expect(dqs.soldOutCount).toBe(4);
    expect(dqs.anomalyCount).toBe(19);
    expect(dqs.missingFieldWarnings).toBe(0);
  });
});

describe('AeroStat Index Calculation Engine', () => {
  it('generates a 30-period consecutive index series', () => {
    const series = getIndexSeries();
    expect(series.length).toBe(30);
  });

  it('anchors the base period strictly at 100.00', () => {
    const series = getIndexSeries();
    expect(series[0].indexValue).toBe(100);
    expect(series[0].date).toBe('2026-08-04');
  });

  it('computes current index at 103.95 on latest date 2026-09-02', () => {
    const series = getIndexSeries();
    const latest = series[series.length - 1];
    expect(latest.indexValue).toBe(103.95);
    expect(latest.date).toBe('2026-09-02');
  });
});

describe('Methodology & Consistency Validation', () => {
  it('validates base period anchor passes with 100.00', () => {
    const series = getIndexSeries();
    const result = validateBasePeriod(series);
    expect(result.passed).toBe(true);
    expect(result.actualBaseValue).toBe(100);
  });

  it('validates period jumps sanity under 25% threshold', () => {
    const series = getIndexSeries();
    const result = validatePeriodJumps(series, 25);
    expect(result.passed).toBe(true);
    expect(result.maxJumpPct).toBe(21.64);
    expect(result.thresholdPct).toBe(25);
  });

  it('validates date continuity with 0 gaps across 30 periods', () => {
    const series = getIndexSeries();
    const result = validateDateContinuity(series);
    expect(result.passed).toBe(true);
    expect(result.totalPeriodsPresent).toBe(30);
    expect(result.gaps.length).toBe(0);
  });

  it('confirms all methodology validation checks pass in summary report', () => {
    const report = runMethodologyValidation();
    expect(report.allPassed).toBe(true);
    expect(report.cumulativeChangePct).toBe(3.95);
  });
});

describe('API Contract & Local Simulation', () => {
  it('simulates GET /v1/index/current returning HTTP 200 and real currentValue', () => {
    const result = simulateGetCurrentIndex();
    expect(result.statusCode).toBe(200);
    expect(result.endpoint).toBe('/v1/index/current');
    if ('data' in result.response) {
      expect(result.response.data.currentValue).toBe(103.95);
      expect(result.response.data.baseValue).toBe(100);
      expect(result.response.data.activeRoutesCount).toBe(3);
    }
  });

  it('simulates GET /v1/index/series returning 30 periods', () => {
    const result = simulateGetIndexSeries(30);
    expect(result.statusCode).toBe(200);
    if ('data' in result.response) {
      expect(result.response.data.totalPeriods).toBe(30);
      expect(result.response.data.series.length).toBe(30);
    }
  });

  it('simulates GET /v1/routes/DEL-BOM/quality returning sector DQS and anomaly count', () => {
    const result = simulateGetRouteQuality('DEL-BOM');
    expect(result.statusCode).toBe(200);
    if ('data' in result.response) {
      expect(result.response.data.route).toBe('DEL-BOM');
      expect(result.response.data.dataQualityScore).toBe(99.02);
      expect(result.response.data.anomalyCount).toBe(7);
      expect(result.response.data.totalObservations).toBe(148);
    }
  });
});

describe('Runtime Pipeline Health Check & Static Snapshot Export', () => {
  it('passes all runtime invariants on live dataset (healthy: true)', () => {
    const health = runPipelineHealthCheck();
    expect(health.healthy).toBe(true);
    expect(health.checks.length).toBe(4);
    expect(health.checks.every((c) => c.passed)).toBe(true);
  });

  it('detects constructed failure cases when invalid data is injected', () => {
    // 1. Broken base period in series (not 100)
    const brokenSeries = getIndexSeries().map((pt, idx) =>
      idx === 0 ? { ...pt, indexValue: 95.0 } : pt
    );
    const brokenResult1 = runPipelineHealthCheck({ indexSeries: brokenSeries });
    expect(brokenResult1.healthy).toBe(false);
    const indexCheck = brokenResult1.checks.find(
      (c) => c.name === 'Index Series 30-Day Continuity & Base Anchor'
    );
    expect(indexCheck?.passed).toBe(false);

    // 2. Broken route weights sum (sum != 1.0)
    const brokenWeights = { 'DEL-BOM': 0.5, 'DEL-BLR': 0.2 }; // sum = 0.7
    const brokenResult2 = runPipelineHealthCheck({ routeWeights: brokenWeights });
    expect(brokenResult2.healthy).toBe(false);
    const weightCheck = brokenResult2.checks.find(
      (c) => c.name === 'Route Weights Normalization'
    );
    expect(weightCheck?.passed).toBe(false);

    // 3. Broken observation count
    const brokenResult3 = runPipelineHealthCheck({
      observations: loadObservations().slice(0, 100),
    });
    expect(brokenResult3.healthy).toBe(false);
    const countCheck = brokenResult3.checks.find(
      (c) => c.name === 'Observation Count & Deduplication'
    );
    expect(countCheck?.passed).toBe(false);

    // 4. Broken DQS score
    const brokenResult4 = runPipelineHealthCheck({
      dataQualityReport: { ...getDataQualityReport(), score: 105 },
    });
    expect(brokenResult4.healthy).toBe(false);
    const dqsCheck = brokenResult4.checks.find(
      (c) => c.name === 'Data Quality Score Range'
    );
    expect(dqsCheck?.passed).toBe(false);
  });

  it('generates a complete verified static snapshot payload for offline presentation fallback', () => {
    const snapshot = generateVerifiedSnapshot();
    expect(snapshot._header.exportTitle).toContain(
      'AeroStat Verified Pipeline Static Snapshot'
    );
    expect(snapshot._header.healthCheckSummary.healthy).toBe(true);
    expect(snapshot._header.datasetSummary.totalObservations).toBe(446);
    expect(snapshot._header.datasetSummary.totalIndexPeriods).toBe(30);
    expect(snapshot._header.datasetSummary.currentDqsScore).toBe(99.18);
    expect(snapshot._header.datasetSummary.latestIndexValue).toBe(103.95);
    expect(snapshot.observations.length).toBe(446);
    expect(snapshot.indexSeries.length).toBe(30);
    expect(snapshot.routeWeights['DEL-BOM']).toBe(0.4402);
  });
});

