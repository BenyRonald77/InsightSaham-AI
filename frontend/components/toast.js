/**
 * InsightSaham — Toast Notifications
 * Deduplicated, queue-capped toast notification system
 */

let toastId = 0;
const activeMessages = new Set();

export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Clean message: strip leading checkmarks/icons if already present
  const cleanMessage = message.replace(/^[✓✕⚠ℹ●\s]+/, '').trim();

  // Deduplication: prevent stacking identical messages within duration
  if (activeMessages.has(cleanMessage)) {
    return;
  }
  activeMessages.add(cleanMessage);

  // Cap maximum visible toasts to 4
  const existingToasts = container.querySelectorAll('.toast');
  if (existingToasts.length >= 4) {
    existingToasts[0].remove();
  }

  const id = `toast-${++toastId}`;
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const toast = document.createElement('div');
  toast.id = id;
  toast.className = `toast ${type}`;
  toast.dataset.message = cleanMessage;
  toast.innerHTML = `
    <span style="font-weight:700; font-size:1.1rem; flex-shrink:0;">${icons[type] || 'ℹ'}</span>
    <span style="line-height:1.35;">${cleanMessage}</span>
  `;

  container.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    activeMessages.delete(cleanMessage);
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 300);
  }, duration);

  return id;
}
