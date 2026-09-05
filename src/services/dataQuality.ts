import type { FareObservation, DataQualityReport } from '@/types/airfare.ts';

/**
 * Computes a Data Quality Score (DQS) for an array of airfare observations.
 *
 * DATA QUALITY SCORING FORMULA:
 * Score = 100 - (soldOutCount / total * 20) - (anomalyCount / total * 15) - (missingFieldWarnings / total * 25)
 * floored at 0.
 *
 * =========================================================================================
 * PROTOTYPE HEURISTIC DISCLAIMER:
 * This scoring formula is an exploratory prototype heuristic designed for early-stage
 * airfare ingestion pipeline validation. It is NOT a validated statistical or econometric
 * methodology. Penalty weights (20 for sold-out/zero-fare records, 15 for statistical price
 * anomalies, and 25 for missing or malformed schema attributes) represent heuristic severity
 * multipliers chosen to highlight data integrity issues for human review.
 * =========================================================================================
 */
export function computeDataQualityScore(observations: FareObservation[]): DataQualityReport {
  const total = observations.length;

  if (total === 0) {
    const emptyReport: DataQualityReport = {
      totalObservations: 0,
      soldOutCount: 0,
      anomalyCount: 0,
      missingFieldWarnings: 0,
      score: 0,
      deductions: {
        soldOutDeduction: 0,
        anomalyDeduction: 0,
        missingFieldDeduction: 0,
      },
    };
    return emptyReport;
  }

  let soldOutCount = 0;
  let anomalyCount = 0;
  let missingFieldWarnings = 0;

  for (const obs of observations) {
    if (obs.status === 'sold_out') {
      soldOutCount++;
    }
    if (obs.isAnomaly) {
      anomalyCount++;
    }
    if (
      !obs.carrier?.trim() ||
      !obs.fareClass?.trim() ||
      !obs.source?.trim() ||
      !obs.observedAt ||
      !obs.origin?.trim() ||
      !obs.destination?.trim() ||
      obs.leadTimeDays == null
    ) {
      missingFieldWarnings++;
    }
  }

  // Deductions calculated with 2 decimal precision so arithmetic matches hand calculation exactly
  const soldOutDeduction = Number(((soldOutCount / total) * 20).toFixed(2));
  const anomalyDeduction = Number(((anomalyCount / total) * 15).toFixed(2));
  const missingFieldDeduction = Number(((missingFieldWarnings / total) * 25).toFixed(2));

  const rawScore = 100 - soldOutDeduction - anomalyDeduction - missingFieldDeduction;
  const score = Number(Math.max(0, rawScore).toFixed(2));

  // Log computed DQS score and its three component deductions separately so arithmetic can be verified by hand
  console.log(
    `[AeroStat] Data Quality Score: ${score.toFixed(2)}/100 (Deductions: sold-out = ${soldOutDeduction.toFixed(2)}, anomaly = ${anomalyDeduction.toFixed(2)}, missing-field = ${missingFieldDeduction.toFixed(2)})`
  );

  return {
    totalObservations: total,
    soldOutCount,
    anomalyCount,
    missingFieldWarnings,
    score,
    deductions: {
      soldOutDeduction,
      anomalyDeduction,
      missingFieldDeduction,
    },
  };
}
