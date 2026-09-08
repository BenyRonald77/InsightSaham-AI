/**
 * InsightSaham — Stock Picker Page
 * Select stocks from filtered pool to run analysis pipeline.
 */
import { api } from '../utils/api.js';
import { formatPrice, formatPercent, formatVolume, getPriceChangeClass } from '../utils/formatters.js';
import { showToast } from '../components/toast.js';

let selectedStocks = new Set();
let allStocks = [];
let currentSector = '';
let searchQuery = '';

export async function renderStockPicker(container) {
  selectedStocks.clear();

  container.innerHTML = `
    <div class="page-header">
      <h1>📋 Pemilihan Saham</h1>
      <p>Pilih saham dari pool yang sudah ter-filter untuk dianalisis</p>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="form-group">
        <label class="form-label">Cari Saham</label>
        <input type="text" class="form-input" id="stock-search"
               placeholder="Ketik kode atau nama saham..." />
      </div>
      <div class="form-group" style="min-width: 180px; flex: 0.5;">
        <label class="form-label">Sektor</label>
        <select class="form-input form-select" id="sector-filter">
          <option value="">Semua Sektor</option>
        </select>
      </div>
      <div class="filter-actions" style="padding-bottom: 2px;">
        <button class="btn btn-secondary btn-sm" id="btn-refresh-pool">
          ↻ Refresh Pool
        </button>
        <span class="selected-count" id="selected-count">0 dipilih</span>
        <button class="btn btn-primary" id="btn-run-analysis" disabled>
          ▶ Jalankan Analisis
        </button>
      </div>
    </div>

    <!-- Progress (hidden by default) -->
    <div id="analysis-progress" style="display:none; margin-bottom: var(--space-lg);">
      <div class="card" style="display:flex; align-items:center; gap: var(--space-md);">
        <div class="loading-spinner"></div>
        <div style="flex:1;">
          <div style="font-weight:600; margin-bottom:4px;" id="progress-text">Memproses...</div>
          <div class="progress-bar">
            <div class="progress-bar-fill" id="progress-fill" style="width:0%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stock Table -->
    <div class="data-table-container">
      <table class="data-table" id="stock-table">
        <thead>
          <tr>
            <th style="width:40px;">
              <input type="checkbox" id="select-all" />
            </th>
            <th>Kode</th>
            <th>Nama</th>
            <th>Sektor</th>
            <th style="text-align:right;">Harga</th>
            <th style="text-align:right;">Perubahan</th>
            <th style="text-align:right;">Volume</th>
          </tr>
        </thead>
        <tbody id="stock-tbody">
          <tr><td colspan="7" class="page-loading" style="padding:40px;"><div class="loading-spinner lg"></div></td></tr>
        </tbody>
      </table>
    </div>
  `;

  // Load sectors
  loadSectors();

  // Load stocks
  await loadStocks();

  // Event handlers
  document.getElementById('stock-search').addEventListener('input', debounce((e) => {
    searchQuery = e.target.value;
    renderTable();
  }, 300));

  document.getElementById('sector-filter').addEventListener('change', (e) => {
    currentSector = e.target.value;
    renderTable();
  });

  document.getElementById('select-all').addEventListener('change', (e) => {
    const filtered = getFilteredStocks();
    if (e.target.checked) {
      filtered.forEach(s => selectedStocks.add(s.code));
    } else {
      filtered.forEach(s => selectedStocks.delete(s.code));
    }
    renderTable();
    updateSelectedCount();
  });

  document.getElementById('btn-refresh-pool').addEventListener('click', async () => {
    showToast('Memperbarui pool saham...', 'info');
    try {
      await api.refreshUniverse();
      await loadStocks();
      showToast('Pool saham berhasil diperbarui!', 'success');
    } catch (err) {
      showToast(`Gagal: ${err.message}`, 'error');
    }
  });

  document.getElementById('btn-run-analysis').addEventListener('click', async () => {
    if (selectedStocks.size === 0) return;
    await runAnalysis();
  });
}

async function loadSectors() {
  try {
    const data = await api.getSectors();
    const select = document.getElementById('sector-filter');
    if (data.sectors) {
      data.sectors.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        select.appendChild(opt);
      });
    }
  } catch (e) {
    // Ignore
  }
}

async function loadStocks() {
  try {
    const data = await api.getUniverse();
    allStocks = data.stocks || [];
    renderTable();
  } catch (err) {
    document.getElementById('stock-tbody').innerHTML = `
      <tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
        Gagal memuat data. Pastikan backend berjalan.<br/>
        <span style="font-size:0.8rem;">${err.message}</span>
      </td></tr>
    `;
  }
}

function getFilteredStocks() {
  let filtered = allStocks;
  if (currentSector) {
    filtered = filtered.filter(s => s.sector === currentSector);
  }
  if (searchQuery) {
    const q = searchQuery.toUpperCase();
    filtered = filtered.filter(s =>
      s.code.toUpperCase().includes(q) ||
      s.name.toUpperCase().includes(q)
    );
  }
  return filtered;
}

function renderTable() {
  const tbody = document.getElementById('stock-tbody');
  const filtered = getFilteredStocks();

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
        ${allStocks.length === 0 ? 'Pool saham kosong. Klik "Refresh Pool" untuk memuat data.' : 'Tidak ada saham yang sesuai filter.'}
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(stock => {
    const checked = selectedStocks.has(stock.code) ? 'checked' : '';
    const changeClass = getPriceChangeClass(stock.price_change_pct);

    return `
      <tr class="${checked ? 'selected-row' : ''}">
        <td>
          <input type="checkbox" class="stock-checkbox" data-code="${stock.code}" ${checked} />
        </td>
        <td class="code-cell">${stock.code}</td>
        <td>${stock.name}</td>
        <td style="color:var(--text-secondary); font-size:0.8rem;">${stock.sector}</td>
        <td class="price-cell" style="text-align:right;">${formatPrice(stock.last_price)}</td>
        <td class="price-cell ${changeClass}" style="text-align:right;">${formatPercent(stock.price_change_pct)}</td>
        <td style="text-align:right; font-family:var(--font-mono); font-size:0.82rem;">${formatVolume(stock.last_volume)}</td>
      </tr>
    `;
  }).join('');

  // Attach checkbox handlers
  tbody.querySelectorAll('.stock-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const code = e.target.dataset.code;
      if (e.target.checked) {
        selectedStocks.add(code);
      } else {
        selectedStocks.delete(code);
      }
      updateSelectedCount();
    });
  });

  updateSelectedCount();
}

function updateSelectedCount() {
  const countEl = document.getElementById('selected-count');
  const btn = document.getElementById('btn-run-analysis');
  countEl.textContent = `${selectedStocks.size} dipilih`;
  btn.disabled = selectedStocks.size === 0;
}

async function runAnalysis() {
  const codes = Array.from(selectedStocks);
  const progressDiv = document.getElementById('analysis-progress');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const btn = document.getElementById('btn-run-analysis');

  btn.disabled = true;
  progressDiv.style.display = 'block';
  progressText.textContent = `Memproses 0 dari ${codes.length} saham...`;
  progressFill.style.width = '0%';

  try {
    const result = await api.runAnalysis(codes);
    showToast(`Analisis dimulai untuk ${codes.length} saham`, 'success');

    // Poll for progress
    const selectionId = result.selection_id;
    const pollInterval = setInterval(async () => {
      try {
        const status = await api.getAnalysisStatus(selectionId);
        const completed = status.completed_stocks || 0;
        const total = status.total_stocks || codes.length;
        const pct = Math.round((completed / total) * 100);

        progressText.textContent = `Memproses ${completed} dari ${total} saham...`;
        progressFill.style.width = `${pct}%`;

        if (status.status === 'completed') {
          clearInterval(pollInterval);
          progressText.textContent = `Selesai! ${total} saham telah dianalisis.`;
          progressFill.style.width = '100%';
          btn.disabled = false;
          showToast(`✓ Analisis selesai! ${total} saham telah diproses.`, 'success', 6000);

          // Clear selection
          selectedStocks.clear();
          renderTable();

          // Navigate to dashboard after delay
          setTimeout(() => {
            window.navigateTo('dashboard');
          }, 2000);
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 3000);

  } catch (err) {
    showToast(`Gagal menjalankan analisis: ${err.message}`, 'error');
    btn.disabled = false;
    progressDiv.style.display = 'none';
  }
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
