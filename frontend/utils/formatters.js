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

/** Format Rupiah with Milyar / Triliun / Juta suffix */
export function formatIDRBillions(value, showSign = false) {
  if (value == null || isNaN(value)) return '-';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : (showSign && value > 0 ? '+' : '');
  if (abs >= 1e12) return `${sign}Rp ${(abs / 1e12).toFixed(2)} T`;
  if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(2)} M`;
  if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(1)} Jt`;
  return `${sign}Rp ${Math.round(abs).toLocaleString('id-ID')}`;
}

/** Format number in thousands/millions */
export function formatNumberShort(value) {
  if (value == null || isNaN(value)) return '-';
  const abs = Math.abs(value);
  if (abs >= 1e6) return (abs / 1e6).toFixed(2) + ' jt';
  if (abs >= 1e3) return (abs / 1e3).toFixed(1) + ' rb';
  return Math.round(abs).toLocaleString('id-ID');
}

/** Get bandar status CSS class */
export function getBandarStatusClass(status) {
  if (!status) return 'neutral';
  const s = status.toUpperCase();
  if (s.includes('ACCUMULATION')) return 'accum';
  if (s.includes('DISTRIBUTION')) return 'dist';
  return 'neutral';
}
