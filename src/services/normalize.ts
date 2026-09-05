import type { FareObservation } from '@/types/airfare.ts';

/**
 * Normalizes a single FareObservation:
 * - Ensures origin and destination IATA codes are uppercase.
 * - Trims whitespace from carrier names.
 * - Asserts baseFare + taxes === totalFare; logs a console.warn if they do not reconcile.
 */
export function normalizeObservation(obs: FareObservation): FareObservation {
  const normalizedOrigin = obs.origin.trim().toUpperCase();
  const normalizedDestination = obs.destination.trim().toUpperCase();
  const normalizedCarrier = obs.carrier.trim();

  // Reconcile baseFare + taxes === totalFare
  // Note: Handle floating-point imprecision using a small epsilon if non-integers, but fares are integers.
  if (obs.baseFare + obs.taxes !== obs.totalFare) {
    console.warn(
      `[AeroStat] Fare reconciliation mismatch for record "${obs.id}": baseFare (${obs.baseFare}) + taxes (${obs.taxes}) !== totalFare (${obs.totalFare})`
    );
  }

  return {
    ...obs,
    origin: normalizedOrigin,
    destination: normalizedDestination,
    carrier: normalizedCarrier,
  };
}

/**
 * Deduplicates observations:
 * For records matching on (origin, destination, carrier, leadTimeDays, observedAt truncated to the day),
 * keeps only one, preferring the one with status "available" over "sold_out".
 * Uses a deterministic tie-breaker (stable sort by record ID) if statuses match.
 * Logs how many duplicates were removed.
 */
export function deduplicateObservations(obsList: FareObservation[]): FareObservation[] {
  // Stably sort input first to guarantee deterministic iteration order
  const stableInput = [...obsList].sort((a, b) => a.id.localeCompare(b.id));
  const map = new Map<string, FareObservation>();
  let duplicatesRemoved = 0;

  for (const obs of stableInput) {
    // Truncate observedAt to day (YYYY-MM-DD)
    const observedDate = obs.observedAt.slice(0, 10);
    const key = `${obs.origin.toUpperCase()}|${obs.destination.toUpperCase()}|${obs.carrier.toLowerCase()}|${obs.leadTimeDays}|${observedDate}`;

    if (!map.has(key)) {
      map.set(key, obs);
    } else {
      duplicatesRemoved++;
      const existing = map.get(key)!;

      // Prefer "available" over "sold_out"
      if (existing.status === 'sold_out' && obs.status === 'available') {
        map.set(key, obs);
      } else if (existing.status === obs.status) {
        // Deterministic tie-breaker: lower lexicographical id wins
        if (obs.id.localeCompare(existing.id) < 0) {
          map.set(key, obs);
        }
      }
      // Otherwise keep existing
    }
  }

  if (duplicatesRemoved > 0) {
    console.log(`[AeroStat] Deduplication removed ${duplicatesRemoved} duplicate record(s).`);
  }

  // Return deterministically sorted by observedAt, then ID
  return Array.from(map.values()).sort((a, b) => {
    const dCmp = a.observedAt.localeCompare(b.observedAt);
    if (dCmp !== 0) return dCmp;
    return a.id.localeCompare(b.id);
  });
}
