/**
 * InsightSaham — API Client
 * Centralized HTTP client for communicating with the FastAPI backend.
 */

const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // === Universe ===
  getUniverse: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/universe${qs ? '?' + qs : ''}`);
  },
  getSectors: () => request('/universe/sectors'),
  refreshUniverse: () => request('/universe/refresh', { method: 'POST' }),
  getUniverseStats: () => request('/universe/stats'),
  getWatchlist: () => request('/universe/watchlist'),

  // === Analysis ===
  runAnalysis: (stockCodes) =>
    request('/analysis/run', {
      method: 'POST',
      body: JSON.stringify({ stock_codes: stockCodes }),
    }),
  getAnalysisStatus: (selectionId) => request(`/analysis/status/${selectionId}`),
  getLatestAnalyses: (limit = 20) => request(`/analysis/latest?limit=${limit}`),
  getAnalysisDetail: (id) => request(`/analysis/detail/${id}`),
  getStockAnalyses: (code, limit = 10) => request(`/analysis/stock/${code}?limit=${limit}`),
  getArchive: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/analysis/archive${qs ? '?' + qs : ''}`);
  },

  // === Settings ===
  getSettings: () => request('/settings'),

  // === Health ===
  getHealth: () => request('/health'),
};
