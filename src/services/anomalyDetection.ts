import type { FareObservation } from '@/types/airfare.ts';

/**
 * Computes a quantile value from an array of numbers sorted in ascending order.
 * Uses standard linear interpolation between data points.
 */
function getQuantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

/**
 * Flags statistical price anomalies using the Interquartile Range (IQR) method:
 * - Groups observations by (origin, destination, leadTimeDays).
 * - For groups with >= 4 records, computes Q1, Q3, and IQR of totalFare.
 * - Outliers outside [Q1 - 1.5 * IQR, Q3 + 1.5 * IQR] have isAnomaly set to true (false otherwise).
 * - Groups with fewer than 4 records are skipped with an informative console log.
 * - Records are NOT dropped from the dataset.
 * - Emits log: "[AeroStat] Anomaly detection: X anomalies flagged across Y route/lead-time groups"
 */
export function flagAnomalies(observations: FareObservation[]): FareObservation[] {
  // Group observations by (origin, destination, leadTimeDays)
  const groups = new Map<string, FareObservation[]>();

  for (const obs of observations) {
    const key = `${obs.origin.toUpperCase()}-${obs.destination.toUpperCase()}-lt${obs.leadTimeDays}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(obs);
  }

  let totalAnomalies = 0;
  let evaluatedGroupsCount = 0;

  // Process each group to identify thresholds in deterministic key order
  const groupThresholds = new Map<string, { lower: number; upper: number }>();
  const sortedGroupKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));

  for (const groupKey of sortedGroupKeys) {
    const groupObs = groups.get(groupKey)!;
    if (groupObs.length < 4) {
      console.warn(
        `[AeroStat] Anomaly detection skipped group ${groupKey}: insufficient observations (${groupObs.length} < 4 required for reliable IQR)`
      );
      continue;
    }

    evaluatedGroupsCount++;
    const sortedFares = groupObs.map((o) => o.totalFare).sort((a, b) => a - b);
    const q1 = getQuantile(sortedFares, 0.25);
    const q3 = getQuantile(sortedFares, 0.75);
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    groupThresholds.set(groupKey, { lower, upper });
  }

  // Annotate all observations with isAnomaly: boolean
  const result: FareObservation[] = observations.map((obs) => {
    const key = `${obs.origin.toUpperCase()}-${obs.destination.toUpperCase()}-lt${obs.leadTimeDays}`;
    const thresholds = groupThresholds.get(key);

    if (!thresholds) {
      // Group was skipped (< 4 items)
      return { ...obs, isAnomaly: false };
    }

    const isAnomaly = obs.totalFare < thresholds.lower || obs.totalFare > thresholds.upper;
    if (isAnomaly) {
      totalAnomalies++;
    }

    return { ...obs, isAnomaly };
  });

  console.log(
    `[AeroStat] Anomaly detection: ${totalAnomalies} anomalies flagged across ${evaluatedGroupsCount} route/lead-time groups`
  );

  return result;
}
