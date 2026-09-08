/**
 * InsightSaham — Toast Notifications
 */

let toastId = 0;

export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

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
  toast.innerHTML = `
    <span style="font-weight:700; font-size:1.1rem;">${icons[type] || 'ℹ'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);

  return id;
}
