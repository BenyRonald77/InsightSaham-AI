/**
 * InsightSaham — Settings Page
 * View application settings and configuration.
 */
import { api } from '../utils/api.js';
import { showToast } from '../components/toast.js';

export async function renderSettings(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>⚙️ Pengaturan</h1>
      <p>Konfigurasi parameter filter, indikator, dan LLM</p>
    </div>

    <div id="settings-content">
      <div class="page-loading">
        <div class="loading-spinner lg"></div>
        <span>Memuat pengaturan...</span>
      </div>
    </div>
  `;

  try {
    const settings = await api.getSettings();
    renderSettingsContent(settings);
  } catch (err) {
    document.getElementById('settings-content').innerHTML = `
      <div class="empty-state">
        <h3>Gagal memuat pengaturan</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

function renderSettingsContent(s) {
  const content = document.getElementById('settings-content');

  content.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--space-lg);">

      <!-- Auto-Filter -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">🔍 Kriteria Auto-Filter</h3>
        </div>
        <div class="panel-section-body">
          <div class="data-row" style="padding: 8px 0;">
            <span class="label">Harga Minimum</span>
            <span class="value text-mono fw-bold">Rp ${s.min_price.toLocaleString('id-ID')}</span>
          </div>
          <div class="data-row" style="padding: 8px 0;">
            <span class="label">Deteksi Suspend (hari)</span>
            <span class="value text-mono fw-bold">${s.suspend_detection_days} hari</span>
          </div>
        </div>
        <div style="margin-top: var(--space-sm); padding: 10px; background: var(--bg-input); border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--text-muted);">
          ℹ Saham dengan harga &lt; Rp ${s.min_price} dan yang terdeteksi suspend (${s.suspend_detection_days} hari tanpa aktivitas) akan dikeluarkan dari pool.
        </div>
      </div>

      <!-- Indicator Parameters -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📐 Parameter Indikator</h3>
        </div>
        <div class="panel-section-body">
          <div class="data-row" style="padding: 6px 0;">
            <span class="label">EMA Short</span>
            <span class="value text-mono">${s.ema_short}</span>
          </div>
          <div class="data-row" style="padding: 6px 0;">
            <span class="label">EMA Medium</span>
            <span class="value text-mono">${s.ema_medium}</span>
          </div>
          <div class="data-row" style="padding: 6px 0;">
            <span class="label">EMA Long</span>
            <span class="value text-mono">${s.ema_long}</span>
          </div>
          <div class="data-row" style="padding: 6px 0;">
            <span class="label">Bollinger Bands</span>
            <span class="value text-mono">(${s.bb_period}, ${s.bb_std})</span>
          </div>
          <div class="data-row" style="padding: 6px 0;">
            <span class="label">Stochastic</span>
            <span class="value text-mono">(${s.stoch_k}, ${s.stoch_d}, ${s.stoch_smooth})</span>
          </div>
          <div class="data-row" style="padding: 6px 0;">
            <span class="label">MACD</span>
            <span class="value text-mono">(${s.macd_fast}, ${s.macd_slow}, ${s.macd_signal})</span>
          </div>
          <div class="data-row" style="padding: 6px 0;">
            <span class="label">Volume MA</span>
            <span class="value text-mono">${s.volume_ma_period}</span>
          </div>
        </div>
      </div>

      <!-- LLM Configuration -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">🤖 Konfigurasi LLM</h3>
        </div>
        <div class="panel-section-body">
          <div class="data-row" style="padding: 8px 0;">
            <span class="label">Provider</span>
            <span class="value fw-bold" style="text-transform: capitalize;">${s.llm_provider}</span>
          </div>
          <div class="data-row" style="padding: 8px 0;">
            <span class="label">Status</span>
            <span class="value">
              ${s.llm_available
                ? '<span class="text-bullish fw-bold">● Online</span>'
                : '<span class="text-bearish fw-bold">● Offline</span>'}
            </span>
          </div>
        </div>
        <div style="margin-top: var(--space-sm); padding: 10px; background: var(--bg-input); border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--text-muted);">
          ${s.llm_available
            ? '✓ API key terkonfigurasi. AI Narrative Engine aktif.'
            : '⚠ API key belum dikonfigurasi. Sistem akan menggunakan fallback template narasi. Set GEMINI_API_KEY di file .env untuk mengaktifkan AI.'}
        </div>
      </div>

      <!-- About -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">ℹ️ Tentang InsightSaham</h3>
        </div>
        <div class="panel-section-body" style="font-size:0.85rem; color:var(--text-secondary); line-height:1.8;">
          <p><strong>InsightSaham</strong> — AI Technical Analysis Generator</p>
          <p>Tool internal untuk mengotomatisasi pembuatan analisis teknikal saham IDX.</p>
          <p style="margin-top:8px;">Versi: <span class="text-mono fw-bold">1.0.0</span> (Fase 1 MVP)</p>
          <p>Sumber Data: <span class="text-mono">yfinance (EOD)</span></p>
        </div>
      </div>
    </div>
  `;
}
