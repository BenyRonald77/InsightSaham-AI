/**
 * InsightSaham — Dashboard Page
 * Shows recent analysis results, stats overview
 */
import { api } from '../utils/api.js';
import { formatPrice, formatPercent, formatDateShort, getPriceChangeClass, getTrendClass } from '../utils/formatters.js';
import { showToast } from '../components/toast.js';

export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>📊 Dashboard</h1>
      <p>Ringkasan hasil analisis teknikal terbaru</p>
    </div>

    <div class="stats-grid" id="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Pool Saham</div>
        <div class="stat-value" id="stat-total">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Lolos Filter</div>
        <div class="stat-value" id="stat-passed">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Analisis Hari Ini</div>
        <div class="stat-value" id="stat-today">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">LLM Status</div>
        <div class="stat-value" id="stat-llm" style="font-size:1rem;">-</div>
      </div>
    </div>

    <div class="card-header" style="margin-bottom: var(--space-md);">
      <h2 class="card-title">Analisis Terbaru</h2>
      <button class="btn btn-secondary btn-sm" id="btn-refresh-dashboard">
        ↻ Refresh
      </button>
    </div>

    <div id="analyses-container" class="analysis-grid">
      <div class="page-loading">
        <div class="loading-spinner lg"></div>
        <span>Memuat data...</span>
      </div>
    </div>
  `;

  // Load data
  loadStats();
  loadLatestAnalyses(container);

  // Event handlers
  document.getElementById('btn-refresh-dashboard')?.addEventListener('click', () => {
    loadLatestAnalyses(container);
  });
}

async function loadStats() {
  try {
    const [statsData, healthData] = await Promise.allSettled([
      api.getUniverseStats(),
      api.getHealth(),
    ]);

    if (statsData.status === 'fulfilled') {
      const stats = statsData.value;
      document.getElementById('stat-total').textContent = stats.total_stocks || 0;
      document.getElementById('stat-passed').textContent = stats.passing_filter || 0;
    }

    if (healthData.status === 'fulfilled') {
      const health = healthData.value;
      const llmEl = document.getElementById('stat-llm');
      if (health.llm_status === 'available') {
        llmEl.innerHTML = `<span class="text-bullish">● Online</span>`;
      } else {
        llmEl.innerHTML = `<span class="text-bearish">● Offline</span>`;
      }
    }
  } catch (err) {
    console.error('Stats load error:', err);
  }

  // Count today's analyses
  try {
    const latest = await api.getLatestAnalyses(100);
    const today = new Date().toISOString().split('T')[0];
    const todayCount = latest.analyses?.filter(a => a.analysis_date === today).length || 0;
    document.getElementById('stat-today').textContent = todayCount;
  } catch (e) {
    // Ignore
  }
}

async function loadLatestAnalyses(container) {
  const grid = document.getElementById('analyses-container');

  try {
    const data = await api.getLatestAnalyses(20);

    if (!data.analyses || data.analyses.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <h3>Belum Ada Analisis</h3>
          <p>Mulai dengan memilih saham dari halaman <strong>Pilih Saham</strong>, lalu jalankan analisis.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = data.analyses.map(a => `
      <div class="analysis-card-mini" data-analysis-id="${a.id}" onclick="window.navigateTo('analysis-detail', ${a.id})">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div class="stock-code">${a.stock_code}</div>
            <div class="stock-name">${a.stock_name}</div>
            <div class="stock-sector">${a.sector}</div>
          </div>
          <span class="trend-badge ${getTrendClass(a.trend)}">${a.trend || '-'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top: var(--space-sm);">
          <div>
            <div class="stock-price">${formatPrice(a.close_price)}</div>
            <div class="stock-change ${getPriceChangeClass(a.price_change_pct)}">${formatPercent(a.price_change_pct)}</div>
          </div>
          <div style="text-align:right; font-size:0.75rem; color:var(--text-muted);">
            ${formatDateShort(a.analysis_date)}
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h3>Tidak dapat memuat data</h3>
        <p>Pastikan backend server sudah berjalan di port 8000.</p>
        <p style="margin-top:8px; font-size:0.8rem; color:var(--text-muted);">${err.message}</p>
      </div>
    `;
  }
}
