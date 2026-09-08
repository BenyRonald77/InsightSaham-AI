/**
 * InsightSaham — Formatters
 * Utility functions for formatting numbers, dates, and values.
 */

/** Format number as Indonesian Rupiah (no symbol) */
export function formatPrice(value) {
  if (value == null || isNaN(value)) return '-';
  return Math.round(value).toLocaleString('id-ID');
}

/** Format volume with K/M/B suffix */
export function formatVolume(value) {
  if (value == null || isNaN(value)) return '-';
  if (value >= 1e12) return (value / 1e12).toFixed(2) + ' T';
  if (value >= 1e9) return (value / 1e9).toFixed(2) + ' B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + ' M';
  if (value >= 1e3) return (value / 1e3).toFixed(2) + ' K';
  return value.toLocaleString('id-ID');
}

/** Format percentage with sign */
export function formatPercent(value, decimals = 2) {
  if (value == null || isNaN(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Format date to Indonesian locale */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Format date short */
export function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Get CSS class for price change */
export function getPriceChangeClass(value) {
  if (value > 0) return 'text-bullish';
  if (value < 0) return 'text-bearish';
  return 'text-neutral';
}

/** Get trend CSS class */
export function getTrendClass(trend) {
  if (!trend) return 'konsolidasi';
  switch (trend.toUpperCase()) {
    case 'BULLISH': return 'bullish';
    case 'BEARISH': return 'bearish';
    default: return 'konsolidasi';
  }
}

/** Format indicator value */
export function formatIndicator(value, decimals = 0) {
  if (value == null || isNaN(value)) return '-';
  return Number(value).toFixed(decimals);
}

/** Safe number formatting */
export function safeNum(value, fallback = '-') {
  if (value == null || isNaN(value)) return fallback;
  return value;
}
