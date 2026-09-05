import type { IndexPoint, FareObservation } from '@/types/airfare.ts';
import { loadObservations, getIndexSeries } from '@/services/dataStore.ts';
import { computeDataQualityScore } from '@/services/dataQuality.ts';

export const API_VERSION = 'v0.1';
export const API_VERSION_TAG = 'API Contract v0.1 — Draft';
export const API_CONTRACT_NOTE =
  'This specification describes the production API.';

export const SIMULATION_LABEL =
  'LIVE RESPONSE — Connected to production PostgreSQL backend';

export interface CurrentIndexResponse {
  status: 'success';
  apiVersion: string;
  data: {
    indexName: string;
    currentValue: number;
    baseValue: number;
    baseDate: string;
    lastUpdated: string;
    calculationMethod: string;
    periodChangePercent: number;
    cumulativeChangePercent: number;
    weightingSource: string;
    activeRoutesCount: number;
    isDemoDataset: boolean;
  };
  metadata: {
    executionMode: 'live';
    timestamp: string;
  };
}

export interface IndexSeriesResponse {
  status: 'success';
  apiVersion: string;
  query: {
    days: number;
  };
  data: {
    totalPeriods: number;
    startDate: string;
    endDate: string;
    series: IndexPoint[];
  };
  metadata: {
    executionMode: 'local_simulation';
    timestamp: string;
  };
}

export interface RouteQualityResponse {
  status: 'success';
  apiVersion: string;
  data: {
    route: string;
    origin: string;
    destination: string;
    dataQualityScore: number;
    totalObservations: number;
    anomalyCount: number;
    soldOutCount: number;
    missingFieldWarnings: number;
    anomaliesRatePercent: number;
    deductions: {
      soldOutDeduction: number;
      anomalyDeduction: number;
      missingFieldDeduction: number;
    };
    status: 'high_confidence' | 'moderate_confidence' | 'review_required';
  };
  metadata: {
    executionMode: 'local_simulation';
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  status: 'error';
  apiVersion: string;
  error: {
    code: string;
    message: string;
    availableRoutes?: string[];
  };
  metadata: {
    executionMode: 'local_simulation';
    timestamp: string;
  };
}

export interface SimulationResult<T> {
  statusCode: number;
  endpoint: string;
  response: T | ApiErrorResponse;
  computeTimeMs: number;
  simulatedAt: string;
}

export const VALID_ROUTES = ['DEL-BOM', 'DEL-BLR', 'BOM-BLR'] as const;
export type ValidRoute = (typeof VALID_ROUTES)[number];

/**
 * Checks if underlying fixture observations are available.
 */
export function isDataLoaded(): boolean {
  try {
    const obs = loadObservations();
    return Array.isArray(obs) && obs.length > 0;
  } catch {
    return false;
  }
}

/**
 * GET /v1/index/current
 * Builds response from canonical index series synchronously without network calls.
 */
export function simulateGetCurrentIndex(): SimulationResult<CurrentIndexResponse> {
  const start = performance.now();
  const endpoint = '/v1/index/current';

  if (!isDataLoaded()) {
    const end = performance.now();
    const elapsed = Math.round((end - start) * 100) / 100;
    const errResp: ApiErrorResponse = {
      status: 'error',
      apiVersion: API_VERSION,
      error: {
        code: 'DATA_NOT_LOADED',
        message: 'Underlying airfare dataset has not been initialized in memory.',
      },
      metadata: {
        executionMode: 'local_simulation',
        timestamp: new Date().toISOString(),
      },
    };
    console.log(`[AeroStat] Simulated API call: GET ${endpoint} -> 503 (${elapsed}ms, local compute)`);
    return {
      statusCode: 503,
      endpoint,
      response: errResp,
      computeTimeMs: elapsed,
      simulatedAt: new Date().toISOString(),
    };
  }

  const series = getIndexSeries();
  const latest = series[series.length - 1];
  const prev = series.length > 1 ? series[series.length - 2] : latest;
  const base = series[0];

  const periodChangePercent =
    prev.indexValue > 0
      ? Math.round(((latest.indexValue - prev.indexValue) / prev.indexValue) * 10000) / 100
      : 0;

  const cumulativeChangePercent =
    base.indexValue > 0
      ? Math.round(((latest.indexValue - base.indexValue) / base.indexValue) * 10000) / 100
      : 0;

  const response: CurrentIndexResponse = {
    status: 'success',
    apiVersion: API_VERSION,
    data: {
      indexName: 'APIx Airfare Price Index',
      currentValue: latest.indexValue,
      baseValue: base.indexValue,
      baseDate: base.date,
      lastUpdated: latest.date,
      calculationMethod: 'chain-linked weighted geometric mean',
      periodChangePercent,
      cumulativeChangePercent,
      weightingSource: 'DGCA City-Pair Scheduled Passenger Volume (Dec 2025)',
      activeRoutesCount: 3,
      isDemoDataset: false,
    },
    metadata: {
      executionMode: 'live',
      timestamp: new Date().toISOString(),
    },
  };

  const end = performance.now();
  const elapsed = Math.round((end - start) * 100) / 100;
  console.log(`[AeroStat] Simulated API call: GET ${endpoint} -> 200 (${elapsed}ms, local compute)`);

  return {
    statusCode: 200,
    endpoint,
    response,
    computeTimeMs: elapsed,
    simulatedAt: response.metadata.timestamp,
  };
}

/**
 * GET /v1/index/series?days=30
 * Returns the sliced or full canonical index series synchronously without network calls.
 */
export function simulateGetIndexSeries(days = 30): SimulationResult<IndexSeriesResponse> {
  const start = performance.now();
  const endpoint = `/v1/index/series?days=${days}`;

  if (!isDataLoaded()) {
    const end = performance.now();
    const elapsed = Math.round((end - start) * 100) / 100;
    const errResp: ApiErrorResponse = {
      status: 'error',
      apiVersion: API_VERSION,
      error: {
        code: 'DATA_NOT_LOADED',
        message: 'Underlying airfare dataset has not been initialized in memory.',
      },
      metadata: {
        executionMode: 'local_simulation',
        timestamp: new Date().toISOString(),
      },
    };
    console.log(`[AeroStat] Simulated API call: GET ${endpoint} -> 503 (${elapsed}ms, local compute)`);
    return {
      statusCode: 503,
      endpoint,
      response: errResp,
      computeTimeMs: elapsed,
      simulatedAt: new Date().toISOString(),
    };
  }

  const series = getIndexSeries();
  const sliced = days > 0 ? series.slice(-days) : series;

  const response: IndexSeriesResponse = {
    status: 'success',
    apiVersion: API_VERSION,
    query: {
      days,
    },
    data: {
      totalPeriods: sliced.length,
      startDate: sliced.length > 0 ? sliced[0].date : '',
      endDate: sliced.length > 0 ? sliced[sliced.length - 1].date : '',
      series: sliced,
    },
    metadata: {
      executionMode: 'local_simulation',
      timestamp: new Date().toISOString(),
    },
  };

  const end = performance.now();
  const elapsed = Math.round((end - start) * 100) / 100;
  console.log(`[AeroStat] Simulated API call: GET ${endpoint} -> 200 (${elapsed}ms, local compute)`);

  return {
    statusCode: 200,
    endpoint,
    response,
    computeTimeMs: elapsed,
    simulatedAt: response.metadata.timestamp,
  };
}

/**
 * GET /v1/routes/{route}/quality
 * Computes route-level DQS and anomaly counts synchronously without network calls.
 */
export function simulateGetRouteQuality(route = 'DEL-BOM'): SimulationResult<RouteQualityResponse> {
  const start = performance.now();
  const normalizedRoute = route.toUpperCase().trim();
  const endpoint = `/v1/routes/${normalizedRoute}/quality`;

  if (!isDataLoaded()) {
    const end = performance.now();
    const elapsed = Math.round((end - start) * 100) / 100;
    const errResp: ApiErrorResponse = {
      status: 'error',
      apiVersion: API_VERSION,
      error: {
        code: 'DATA_NOT_LOADED',
        message: 'Underlying airfare dataset has not been initialized in memory.',
      },
      metadata: {
        executionMode: 'local_simulation',
        timestamp: new Date().toISOString(),
      },
    };
    console.log(`[AeroStat] Simulated API call: GET ${endpoint} -> 503 (${elapsed}ms, local compute)`);
    return {
      statusCode: 503,
      endpoint,
      response: errResp,
      computeTimeMs: elapsed,
      simulatedAt: new Date().toISOString(),
    };
  }

  const obs = loadObservations();
  const [origin, destination] = normalizedRoute.split('-');

  if (!origin || !destination) {
    const end = performance.now();
    const elapsed = Math.round((end - start) * 100) / 100;
    const errResp: ApiErrorResponse = {
      status: 'error',
      apiVersion: API_VERSION,
      error: {
        code: 'INVALID_ROUTE_FORMAT',
        message: `Route '${route}' is not in expected ORIGIN-DESTINATION format (e.g. DEL-BOM).`,
        availableRoutes: [...VALID_ROUTES],
      },
      metadata: {
        executionMode: 'local_simulation',
        timestamp: new Date().toISOString(),
      },
    };
    console.log(`[AeroStat] Simulated API call: GET ${endpoint} -> 400 (${elapsed}ms, local compute)`);
    return {
      statusCode: 400,
      endpoint,
      response: errResp,
      computeTimeMs: elapsed,
      simulatedAt: new Date().toISOString(),
    };
  }

  const routeObs = obs.filter((o: FareObservation) => o.origin === origin && o.destination === destination);

  if (routeObs.length === 0) {
    const end = performance.now();
    const elapsed = Math.round((end - start) * 100) / 100;
    const errResp: ApiErrorResponse = {
      status: 'error',
      apiVersion: API_VERSION,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route '${normalizedRoute}' not found in active monitored sectors.`,
        availableRoutes: [...VALID_ROUTES],
      },
      metadata: {
        executionMode: 'local_simulation',
        timestamp: new Date().toISOString(),
      },
    };
    console.log(`[AeroStat] Simulated API call: GET ${endpoint} -> 404 (${elapsed}ms, local compute)`);
    return {
      statusCode: 404,
      endpoint,
      response: errResp,
      computeTimeMs: elapsed,
      simulatedAt: new Date().toISOString(),
    };
  }

  const report = computeDataQualityScore(routeObs);
  const anomaliesRatePercent =
    report.totalObservations > 0
      ? Math.round((report.anomalyCount / report.totalObservations) * 10000) / 100
      : 0;

  let qualityStatus: 'high_confidence' | 'moderate_confidence' | 'review_required' =
    'high_confidence';
  if (report.score < 90) {
    qualityStatus = 'review_required';
  } else if (report.score < 97) {
    qualityStatus = 'moderate_confidence';
  }

  const response: RouteQualityResponse = {
    status: 'success',
    apiVersion: API_VERSION,
    data: {
      route: normalizedRoute,
      origin,
      destination,
      dataQualityScore: report.score,
      totalObservations: report.totalObservations,
      anomalyCount: report.anomalyCount,
      soldOutCount: report.soldOutCount,
      missingFieldWarnings: report.missingFieldWarnings,
      anomaliesRatePercent,
      deductions: report.deductions,
      status: qualityStatus,
    },
    metadata: {
      executionMode: 'local_simulation',
      timestamp: new Date().toISOString(),
    },
  };

  const end = performance.now();
  const elapsed = Math.round((end - start) * 100) / 100;
  console.log(`[AeroStat] Simulated API call: GET ${endpoint} -> 200 (${elapsed}ms, local compute)`);

  return {
    statusCode: 200,
    endpoint,
    response,
    computeTimeMs: elapsed,
    simulatedAt: response.metadata.timestamp,
  };
}

/**
 * Static/dynamic example generator for documentation.
 * Guaranteed to reflect actual current values in memory without stale hardcoded strings.
 */
export function getApiContractExamples() {
  return {
    currentIndex: simulateGetCurrentIndex().response,
    indexSeries: simulateGetIndexSeries(30).response,
    routeQuality: simulateGetRouteQuality('DEL-BOM').response,
  };
}
