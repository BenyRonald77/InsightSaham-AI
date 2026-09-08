/**
 * InsightSaham — Archive Page
 * Browse historical analysis results with filters.
 */
import { api } from '../utils/api.js';
import { formatPrice, formatPercent, formatDateShort, getPriceChangeClass, getTrendClass } from '../utils/formatters.js';

export async function renderArchive(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>🗄️ Arsip Historis</h1>
      <p>Browse seluruh hasil analisis per saham per tanggal</p>
    </div>

    <div class="filter-bar">
      <div class="form-group">
        <label class="form-label">Kode Saham</label>
        <input type="text" class="form-input" id="archive-stock" placeholder="Contoh: BBCA" />
      </div>
      <div class="form-group" style="flex:0.5; min-width:160px;">
        <label class="form-label">Trend</label>
        <select class="form-input form-select" id="archive-trend">
          <option value="">Semua</option>
          <option value="BULLISH">Bullish</option>
          <option value="BEARISH">Bearish</option>
          <option value="KONSOLIDASI">Konsolidasi</option>
        </select>
      </div>
      <div class="form-group" style="flex:0.5; min-width:160px;">
        <label class="form-label">Dari Tanggal</label>
        <input type="date" class="form-input" id="archive-from" />
      </div>
      <div class="form-group" style="flex:0.5; min-width:160px;">
        <label class="form-label">Sampai Tanggal</label>
        <input type="date" class="form-input" id="archive-to" />
      </div>
      <div class="filter-actions" style="padding-bottom:2px;">
        <button class="btn btn-primary btn-sm" id="btn-search-archive">🔍 Cari</button>
      </div>
    </div>

    <div id="archive-results">
      <div class="page-loading">
        <div class="loading-spinner lg"></div>
        <span>Memuat arsip...</span>
      </div>
    </div>
  `;

  // Load initial data
  loadArchive({});

  // Search handler
  document.getElementById('btn-search-archive').addEventListener('click', () => {
    const params = {};
    const stock = document.getElementById('archive-stock').value.trim();
    const trend = document.getElementById('archive-trend').value;
    const from = document.getElementById('archive-from').value;
    const to = document.getElementById('archive-to').value;

    if (stock) params.stock_code = stock;
    if (trend) params.trend = trend;
    if (from) params.date_from = from;
    if (to) params.date_to = to;

    loadArchive(params);
  });
}

async function loadArchive(params) {
  const results = document.getElementById('archive-results');

  try {
    const data = await api.getArchive(params);

    if (!data.analyses || data.analyses.length === 0) {
      results.innerHTML = `
        <div class="empty-state">
          <h3>Tidak ada data ditemukan</h3>
          <p>Coba ubah filter pencarian atau jalankan analisis terlebih dahulu.</p>
        </div>
      `;
      return;
    }

    results.innerHTML = `
      <div style="margin-bottom: var(--space-sm); color:var(--text-muted); font-size:0.85rem;">
        Ditemukan ${data.total} hasil analisis
      </div>
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama</th>
              <th>Sektor</th>
              <th>Tanggal</th>
              <th style="text-align:right;">Harga</th>
              <th style="text-align:right;">Perubahan</th>
              <th>Trend</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${data.analyses.map(a => `
              <tr>
                <td class="code-cell">${a.stock_code}</td>
                <td>${a.stock_name}</td>
                <td style="color:var(--text-secondary); font-size:0.8rem;">${a.sector}</td>
                <td style="font-size:0.82rem;">${formatDateShort(a.analysis_date)}</td>
                <td class="price-cell" style="text-align:right;">${formatPrice(a.close_price)}</td>
                <td class="price-cell ${getPriceChangeClass(a.price_change_pct)}" style="text-align:right;">${formatPercent(a.price_change_pct)}</td>
                <td><span class="trend-badge ${getTrendClass(a.trend)}">${a.trend || '-'}</span></td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="window.navigateTo('analysis-detail', ${a.id})">Detail →</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    results.innerHTML = `
      <div class="empty-state">
        <h3>Gagal memuat arsip</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}
