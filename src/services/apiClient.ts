import {
  CurrentIndexResponse,
  IndexSeriesResponse,
  RouteQualityResponse,
  simulateGetCurrentIndex,
  simulateGetIndexSeries,
  simulateGetRouteQuality,
} from './apiContract';

const BASE_URL = 'http://localhost:8000';

/**
 * Fetches the current index from the live backend.
 * Gracefully falls back to the local simulation if the backend is unavailable.
 */
export async function fetchCurrentIndex(): Promise<CurrentIndexResponse> {
  try {
    const response = await fetch(`${BASE_URL}/v1/index/current`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Backend unavailable, falling back to simulated data', error);
    return simulateGetCurrentIndex().response as CurrentIndexResponse;
  }
}

/**
 * Fetches the index series from the live backend.
 * Gracefully falls back to the local simulation if the backend is unavailable.
 */
export async function fetchIndexSeries(days = 30): Promise<IndexSeriesResponse> {
  try {
    const response = await fetch(`${BASE_URL}/v1/index/series?days=${days}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Backend unavailable, falling back to simulated data', error);
    return simulateGetIndexSeries(days).response as IndexSeriesResponse;
  }
}

/**
 * Fetches route quality from the live backend.
 * Gracefully falls back to the local simulation if the backend is unavailable.
 */
export async function fetchRouteQuality(route = 'DEL-BOM'): Promise<RouteQualityResponse> {
  try {
    const response = await fetch(`${BASE_URL}/v1/routes/${route}/quality`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Backend unavailable, falling back to simulated data', error);
    return simulateGetRouteQuality(route).response as RouteQualityResponse;
  }
}

/**
 * Fetches the health status of the scraper nodes.
 */
export async function fetchScraperHealth(): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/v1/scraper/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch scraper health:', error);
    throw error;
  }
}

/**
 * Fetches the latest ticker data.
 */
export async function fetchTickerData(): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/v1/scraper/ticker`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch ticker data:', error);
    throw error;
  }
}

/**
 * Triggers a manual live scrape.
 */
export async function triggerLiveScrape(): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/v1/scraper/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to trigger live scrape:', error);
    throw error;
  }
}

/**
 * Fetches all live observations.
 */
export async function fetchObservations(): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/v1/observations`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch observations:', error);
    throw error;
  }
}

