/**
 * InsightSaham — Dashboard Page
 * Displays stats, curated wishlists (Konglomerat & Sektoral), and latest analyses.
 */
import { api } from '../utils/api.js';
import { formatPrice, formatPercent, formatDateShort, getPriceChangeClass, getTrendClass, getBandarStatusClass } from '../utils/formatters.js';
import { showToast } from '../components/toast.js';

// Page state
let watchlistData = null;
let activeCategory = 'all';
let searchQuery = '';
let recentAnalyses = [];
let activeTrendFilter = 'all';

// Tracking active running analyses to prevent duplicates and race conditions
const runningAnalyses = new Set();
let isBatchRunning = false;

export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
      <div>
        <h1>📊 Dashboard & Watchlist</h1>
        <p>Ringkasan pasar, curated watchlist saham konglomerat & sektoral, serta kartu analisis teknikal</p>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" id="btn-refresh-all">
          ↻ Refresh Data
        </button>
        <button class="btn btn-primary btn-sm" onclick="window.navigateTo('stock-picker')">
          📋 Ke Pemilihan Saham
        </button>
      </div>
    </div>

    <!-- Top Statistics Grid -->
    <div class="stats-grid" id="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Pool Saham</div>
        <div class="stat-value" id="stat-total">-</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;" id="stat-sub-total">Lolos: -</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Curated Watchlist</div>
        <div class="stat-value text-accent" id="stat-watchlist">-</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;" id="stat-sub-watchlist">5 Kategori • 17 Sub-Grup</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Analisis Tersimpan</div>
        <div class="stat-value" id="stat-analyses-count">-</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;" id="stat-sub-today">Hari Ini: -</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">AI Engine (Gemini)</div>
        <div class="stat-value" id="stat-llm" style="font-size:1.1rem;">-</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Analisis Narasi Otomatis</div>
      </div>
    </div>

    <!-- Real-time Analysis Progress Banner (Hidden by default) -->
    <div id="dashboard-progress-box" style="display:none; margin-bottom: var(--space-xl);">
      <div class="card" style="display:flex; align-items:center; gap: var(--space-md); border-color: var(--accent-primary-dim);">
        <div class="loading-spinner"></div>
        <div style="flex:1;">
          <div style="font-weight:600; margin-bottom:4px;" id="dashboard-progress-text">Memproses analisis...</div>
          <div class="progress-bar">
            <div class="progress-bar-fill" id="dashboard-progress-fill" style="width:0%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- =====================================================
         CURATED WATCHLIST SECTION
         ===================================================== -->
    <section class="watchlist-section" id="watchlist-section">
      <div class="watchlist-header-bar">
        <div>
          <h2 class="card-title" style="display:flex; align-items:center; gap:8px;">
            <span>⭐</span> Curated Watchlist & Sektoral
          </h2>
          <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:2px;">
            Grup saham pilihan terkurasi: Konglomerasi besar, perbankan, tambang, pelayaran, dan kesehatan
          </p>
        </div>

        <div class="watchlist-search-box">
          <svg class="watchlist-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            class="watchlist-search-input"
            id="watchlist-search"
            placeholder="Cari kode atau nama di watchlist (cth: BREN, Barito)..."
          />
        </div>
      </div>

      <!-- Category Navigation Tabs -->
      <div class="watchlist-nav" id="watchlist-nav">
        <button class="watchlist-nav-btn active" data-cat="all">
          <span>⭐</span> Semua Wishlist
          <span class="watchlist-nav-badge" id="badge-all">...</span>
        </button>
        <button class="watchlist-nav-btn" data-cat="konglomerat">
          <span>🏢</span> Saham Konglomerat
          <span class="watchlist-nav-badge" id="badge-konglomerat">8 Grup</span>
        </button>
        <button class="watchlist-nav-btn" data-cat="perbankan">
          <span>🏦</span> Saham Perbankan
          <span class="watchlist-nav-badge" id="badge-perbankan">4 Sub</span>
        </button>
        <button class="watchlist-nav-btn" data-cat="tambang">
          <span>⛏️</span> Saham Tambang
          <span class="watchlist-nav-badge" id="badge-tambang">2 Sub</span>
        </button>
        <button class="watchlist-nav-btn" data-cat="perkapalan">
          <span>🚢</span> Saham Perkapalan
          <span class="watchlist-nav-badge" id="badge-perkapalan">9 Saham</span>
        </button>
        <button class="watchlist-nav-btn" data-cat="kesehatan">
          <span>🏥</span> Saham Kesehatan
          <span class="watchlist-nav-badge" id="badge-kesehatan">2 Sub</span>
        </button>
      </div>

      <!-- Active Category Banner -->
      <div class="watchlist-banner" id="watchlist-banner">
        <div>
          <div class="watchlist-banner-title" id="banner-title">
            <span>⭐</span> Semua Watchlist Pilihan
          </div>
          <div class="watchlist-banner-desc" id="banner-desc">
            Menampilkan seluruh saham terkurasi dari 5 sektor dan grup konglomerasi utama di IDX
          </div>
        </div>
        <div id="banner-stats" style="font-size:0.85rem; color:var(--accent-primary); font-family:var(--font-mono); font-weight:700;">
          ...
        </div>
      </div>

      <!-- Watchlist Groups Container -->
      <div class="watchlist-groups-container" id="watchlist-groups-container">
        <div class="page-loading" style="padding:40px;">
          <div class="loading-spinner lg"></div>
          <span>Memuat curated watchlist...</span>
        </div>
      </div>
    </section>

    <!-- =====================================================
         RECENT ANALYSES SECTION
         ===================================================== -->
    <section class="recent-analyses-section">
      <div class="card-header" style="margin-bottom: var(--space-md); flex-wrap:wrap; gap:12px;">
        <div>
          <h2 class="card-title">Analisis Terbaru</h2>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:2px;">
            Riwayat analisis teknikal & AI narrative yang telah digenerate
          </p>
        </div>

        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <div style="display:flex; gap:4px; background:var(--bg-surface); padding:3px; border-radius:var(--radius-md); border:1px solid var(--border-primary);">
            <button class="btn-trend-filter active" data-filter="all">Semua</button>
            <button class="btn-trend-filter" data-filter="Bullish">🟢 Bullish</button>
            <button class="btn-trend-filter" data-filter="Bearish">🔴 Bearish</button>
            <button class="btn-trend-filter" data-filter="Konsolidasi">🟡 Konsolidasi</button>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-refresh-analyses">
            ↻ Refresh
          </button>
        </div>
      </div>

      <div id="analyses-container" class="analysis-grid">
        <div class="page-loading">
          <div class="loading-spinner lg"></div>
          <span>Memuat analisis terbaru...</span>
        </div>
      </div>
    </section>
  `;

  // Attach event handlers
  setupEventListeners(container);

  // Load data
  loadDashboardData(container);
}

function setupEventListeners(container) {
  // Global refresh
  document.getElementById('btn-refresh-all')?.addEventListener('click', () => {
    loadDashboardData(container);
    showToast('Data dashboard & watchlist diperbarui', 'info');
  });

  // Recent analyses refresh
  document.getElementById('btn-refresh-analyses')?.addEventListener('click', () => {
    loadLatestAnalyses();
  });

  // Category tab navigation
  document.getElementById('watchlist-nav')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.watchlist-nav-btn');
    if (!btn) return;
    const cat = btn.dataset.cat;
    if (!cat) return;

    document.querySelectorAll('.watchlist-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    activeCategory = cat;
    updateBanner();
    renderWatchlistGroups();
  });

  // Search input
  const searchInput = document.getElementById('watchlist-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderWatchlistGroups();
    }, 200));
  }

  // Trend filter buttons
  document.querySelectorAll('.btn-trend-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-trend-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTrendFilter = btn.dataset.filter;
      renderAnalysesGrid();
    });
  });
}

async function loadDashboardData(container) {
  await Promise.allSettled([
    loadStats(),
    loadWatchlist(),
    loadLatestAnalyses(),
  ]);
}

async function loadStats() {
  try {
    const [statsData, healthData] = await Promise.allSettled([
      api.getUniverseStats(),
      api.getHealth(),
    ]);

    if (statsData.status === 'fulfilled') {
      const stats = statsData.value;
      const total = stats.total_stocks || 0;
      const passed = stats.passing_filter || 0;
      const statTotal = document.getElementById('stat-total');
      const statSubTotal = document.getElementById('stat-sub-total');
      if (statTotal) statTotal.textContent = total;
      if (statSubTotal) statSubTotal.textContent = `Lolos Filter: ${passed} emiten`;
    }

    if (healthData.status === 'fulfilled') {
      const health = healthData.value;
      const llmEl = document.getElementById('stat-llm');
      if (llmEl) {
        if (health.llm_status === 'available') {
          llmEl.innerHTML = `<span class="text-bullish" style="display:inline-flex; align-items:center; gap:6px;">● Online</span>`;
        } else {
          llmEl.innerHTML = `<span class="text-bearish" style="display:inline-flex; align-items:center; gap:6px;">● Offline</span>`;
        }
      }
    }
  } catch (err) {
    console.error('Stats load error:', err);
  }
}

async function loadWatchlist() {
  const container = document.getElementById('watchlist-groups-container');
  try {
    const data = await api.getWatchlist();
    watchlistData = data;

    const statWatchlist = document.getElementById('stat-watchlist');
    if (statWatchlist) {
      statWatchlist.textContent = `${data.total_stocks} Saham`;
    }

    const badgeAll = document.getElementById('badge-all');
    if (badgeAll) {
      badgeAll.textContent = `${data.total_stocks} Saham`;
    }

    updateBanner();
    renderWatchlistGroups();
  } catch (err) {
    console.error('Failed to load watchlist:', err);
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="padding:40px;">
          <h3>Gagal memuat curated watchlist</h3>
          <p style="color:var(--text-muted);">${err.message}</p>
        </div>
      `;
    }
  }
}

function updateBanner() {
  const titleEl = document.getElementById('banner-title');
  const descEl = document.getElementById('banner-desc');
  const statsEl = document.getElementById('banner-stats');
  if (!titleEl || !watchlistData) return;

  if (activeCategory === 'all') {
    titleEl.innerHTML = `<span>⭐</span> Semua Watchlist Terkurasi`;
    descEl.textContent = 'Menampilkan seluruh saham terkurasi dari 5 sektor dan grup konglomerasi utama di IDX';
    statsEl.textContent = `${watchlistData.total_stocks} Saham • ${watchlistData.categories.reduce((acc, c) => acc + c.groups.length, 0)} Sub-Grup`;
  } else {
    const cat = watchlistData.categories.find(c => c.id === activeCategory);
    if (cat) {
      titleEl.innerHTML = `<span>${cat.icon}</span> ${cat.title}`;
      descEl.textContent = cat.description;
      const stocksCount = cat.groups.reduce((acc, g) => acc + g.stocks.length, 0);
      statsEl.textContent = `${stocksCount} Saham • ${cat.groups.length} Sub-Grup`;
    }
  }
}

function renderWatchlistGroups() {
  const container = document.getElementById('watchlist-groups-container');
  if (!container || !watchlistData) return;

  // Filter categories
  let categoriesToRender = watchlistData.categories;
  if (activeCategory !== 'all') {
    categoriesToRender = watchlistData.categories.filter(c => c.id === activeCategory);
  }

  // Filter groups and stocks based on searchQuery
  const renderedGroups = [];

  for (const cat of categoriesToRender) {
    for (const grp of cat.groups) {
      let matchingStocks = grp.stocks;

      if (searchQuery) {
        matchingStocks = grp.stocks.filter(s =>
          s.code.toLowerCase().includes(searchQuery) ||
          s.name.toLowerCase().includes(searchQuery) ||
          grp.name.toLowerCase().includes(searchQuery)
        );
      }

      if (matchingStocks.length > 0) {
        renderedGroups.push({
          categoryIcon: cat.icon,
          categoryTitle: cat.title,
          groupName: grp.name,
          groupShortName: grp.short_name,
          stocks: matchingStocks,
        });
      }
    }
  }

  if (renderedGroups.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:40px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>Tidak ada saham yang cocok</h3>
        <p>Coba kata kunci pencarian lain atau pilih tab kategori yang berbeda.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = renderedGroups.map((grp) => {
    const stockCodesJson = encodeURIComponent(JSON.stringify(grp.stocks.map(s => s.code)));

    return `
      <div class="watchlist-group-card">
        <div class="watchlist-group-header">
          <div class="watchlist-group-title">
            <span>${grp.categoryIcon}</span>
            <span>${grp.groupName}</span>
            <span class="watchlist-group-tag">${grp.stocks.length} Saham</span>
          </div>

          <div class="watchlist-group-actions">
            <button
              class="btn btn-secondary btn-sm"
              onclick="window.selectGroupToPicker('${stockCodesJson}')"
              title="Pilih seluruh saham grup ini di halaman Pemilihan Saham"
            >
              📋 Pilih ke Pool
            </button>
            <button
              class="btn btn-primary btn-sm"
              onclick="window.runBatchAnalysis('${stockCodesJson}', '${grp.groupShortName}')"
              title="Analisis semua saham di grup ini secara otomatis"
            >
              ▶ Analisis Grup (${grp.stocks.length})
            </button>
          </div>
        </div>

        <div class="watchlist-stocks-grid">
          ${grp.stocks.map(stock => {
            const hasAnalysis = Boolean(stock.has_analysis && stock.latest_analysis);
            const trend = hasAnalysis ? stock.latest_analysis.trend : '';
            const price = stock.last_price || 0;
            const changePct = stock.price_change_pct || 0;
            const isAnalyzing = runningAnalyses.has(stock.code);

            return `
              <div class="watchlist-stock-card" id="w-card-${stock.code}">
                <div>
                  <div class="w-stock-top">
                    <span class="w-stock-code">${stock.code}</span>
                    ${trend ? `
                      <span class="trend-badge ${getTrendClass(trend)}" style="font-size:0.7rem; padding:2px 8px;">
                        ${trend}
                      </span>
                    ` : `
                      <span style="font-size:0.7rem; color:var(--text-muted); background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px;">
                        Siap Analisis
                      </span>
                    `}
                  </div>

                  <div class="w-stock-name" title="${stock.name}">
                    ${stock.name}
                  </div>
                </div>

                <div>
                  <div class="w-stock-price-box" style="margin-bottom: 8px;">
                    <div>
                      <div style="font-size:0.68rem; color:var(--text-muted);">Harga</div>
                      <div class="w-stock-price">${price > 0 ? formatPrice(price) : '<span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">Belum Sync</span>'}</div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:0.68rem; color:var(--text-muted);">Perubahan</div>
                      <div class="w-stock-change ${getPriceChangeClass(changePct)}">
                        ${price > 0 ? (changePct > 0 ? '▲ ' : changePct < 0 ? '▼ ' : '') + formatPercent(changePct) : '-'}
                      </div>
                    </div>
                  </div>

                  <div class="w-stock-actions">
                    ${hasAnalysis ? `
                      <button
                        class="btn-w-primary has-analysis"
                        onclick="window.navigateTo('analysis-detail', ${stock.latest_analysis.id})"
                        title="Buka kartu analisis teknikal & AI narrative"
                      >
                        👁️ Lihat Kartu
                      </button>
                      <button
                        class="btn-w-icon"
                        id="btn-analyze-${stock.code}"
                        onclick="window.runSingleAnalysis('${stock.code}')"
                        title="Analisis ulang ${stock.code}"
                        ${isAnalyzing ? 'disabled' : ''}
                      >
                        ${isAnalyzing ? '<span class="loading-spinner" style="width:12px; height:12px;"></span>' : '↻'}
                      </button>
                    ` : `
                      <button
                        class="btn-w-primary no-analysis"
                        id="btn-analyze-${stock.code}"
                        onclick="window.runSingleAnalysis('${stock.code}')"
                        title="Jalankan analisis teknikal & AI narrative untuk saham ini"
                        ${isAnalyzing ? 'disabled' : ''}
                      >
                        ${isAnalyzing ? '<span class="loading-spinner" style="width:12px; height:12px;"></span> Memproses...' : '⚡ Jalankan Analisis'}
                      </button>
                    `}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

async function loadLatestAnalyses() {
  const grid = document.getElementById('analyses-container');
  try {
    const data = await api.getLatestAnalyses(40);
    recentAnalyses = data.analyses || [];

    const today = new Date().toISOString().split('T')[0];
    const todayCount = recentAnalyses.filter(a => a.analysis_date === today).length;

    const statCount = document.getElementById('stat-analyses-count');
    const statToday = document.getElementById('stat-sub-today');
    if (statCount) statCount.textContent = `${recentAnalyses.length}`;
    if (statToday) statToday.textContent = `Hari ini: ${todayCount} dianalisis`;

    renderAnalysesGrid();
  } catch (err) {
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>Tidak dapat memuat data analisis</h3>
          <p style="margin-top:8px; font-size:0.8rem; color:var(--text-muted);">${err.message}</p>
        </div>
      `;
    }
  }
}

function renderAnalysesGrid() {
  const grid = document.getElementById('analyses-container');
  if (!grid) return;

  let filtered = recentAnalyses;
  if (activeTrendFilter !== 'all') {
    filtered = recentAnalyses.filter(a => (a.trend || '').toLowerCase() === activeTrendFilter.toLowerCase());
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        <h3>Belum Ada Hasil Analisis</h3>
        <p>Klik tombol <strong>⚡ Jalankan Analisis</strong> pada salah satu saham di Wishlist di atas, atau buka halaman <strong>Pilih Saham</strong>.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(a => `
    <div class="analysis-card-mini" data-analysis-id="${a.id}" onclick="window.navigateTo('analysis-detail', ${a.id})">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div class="stock-code">${a.stock_code}</div>
          <div class="stock-name">${a.stock_name}</div>
          <div class="stock-sector">${a.sector}</div>
        </div>
        <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
          <span class="trend-badge ${getTrendClass(a.trend)}">${a.trend || '-'}</span>
          ${a.bandar_status ? `
            <span class="bandar-status-badge ${getBandarStatusClass(a.bandar_status)}" style="font-size:0.68rem; padding:2px 6px;">
              ${a.bandar_status_label || a.bandar_status}
            </span>
          ` : ''}
        </div>
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
}

// =====================================================
// GLOBAL ACTIONS (CALLED FROM HTML ONCLICK)
// =====================================================

window.runSingleAnalysis = async function (stockCode) {
  // Prevent duplicate runs for the same stock
  if (runningAnalyses.has(stockCode)) {
    showToast(`Analisis ${stockCode} sedang diproses...`, 'info');
    return;
  }

  runningAnalyses.add(stockCode);
  const btn = document.getElementById(`btn-analyze-${stockCode}`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner" style="width:12px; height:12px;"></span> Memproses...`;
  }

  showToast(`Memulai analisis teknikal & AI narrative untuk ${stockCode}...`, 'info');

  try {
    const result = await api.runAnalysis([stockCode]);
    const selectionId = result.selection_id;

    // Sequential polling loop with await sleep (NOT setInterval!)
    let isCompleted = false;
    let attempts = 0;
    const maxAttempts = 35; // ~70 seconds max

    while (!isCompleted && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2000));
      attempts++;

      try {
        const status = await api.getAnalysisStatus(selectionId);

        if (status.status === 'completed') {
          isCompleted = true;
          showToast(`Analisis ${stockCode} selesai!`, 'success');

          // Refresh data
          await Promise.allSettled([
            loadWatchlist(),
            loadLatestAnalyses(),
          ]);

          // Open analysis card
          try {
            const stockAnalyses = await api.getStockAnalyses(stockCode, 1);
            if (stockAnalyses.analyses && stockAnalyses.analyses.length > 0) {
              const latestId = stockAnalyses.analyses[0].id;
              window.navigateTo('analysis-detail', latestId);
            }
          } catch (e) {
            // Ignore
          }
          break;
        } else if (status.status === 'failed') {
          isCompleted = true;
          showToast(`Gagal menganalisis ${stockCode}`, 'error');
          break;
        }
      } catch (err) {
        // Continue polling on transient network glitch
      }
    }

    if (!isCompleted) {
      showToast(`Waktu analisis ${stockCode} habis. Silakan periksa beberapa saat lagi.`, 'warning');
      await Promise.allSettled([loadWatchlist(), loadLatestAnalyses()]);
    }

  } catch (err) {
    showToast(`Gagal: ${err.message}`, 'error');
  } finally {
    runningAnalyses.delete(stockCode);
    const currentBtn = document.getElementById(`btn-analyze-${stockCode}`);
    if (currentBtn) {
      currentBtn.disabled = false;
    }
  }
};

window.runBatchAnalysis = async function (stockCodesJsonEncoded, groupName) {
  if (isBatchRunning) {
    showToast(`Batch analisis lain sedang berjalan, harap tunggu hingga selesai.`, 'warning');
    return;
  }

  try {
    const codes = JSON.parse(decodeURIComponent(stockCodesJsonEncoded));
    if (!codes || codes.length === 0) return;

    isBatchRunning = true;
    const progressBox = document.getElementById('dashboard-progress-box');
    const progressText = document.getElementById('dashboard-progress-text');
    const progressFill = document.getElementById('dashboard-progress-fill');

    if (progressBox) progressBox.style.display = 'block';
    if (progressText) progressText.textContent = `Memproses 0 dari ${codes.length} saham di ${groupName}...`;
    if (progressFill) progressFill.style.width = '0%';

    showToast(`Memulai batch analisis untuk ${codes.length} saham di ${groupName}...`, 'info');

    const result = await api.runAnalysis(codes);
    const selectionId = result.selection_id;

    let isCompleted = false;
    let attempts = 0;
    const maxAttempts = 60; // ~150 seconds max

    while (!isCompleted && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2500));
      attempts++;

      try {
        const status = await api.getAnalysisStatus(selectionId);
        const completed = status.completed_stocks || 0;
        const total = status.total_stocks || codes.length;
        const pct = Math.round((completed / total) * 100);

        if (progressText) progressText.textContent = `Memproses ${completed} dari ${total} saham di ${groupName}...`;
        if (progressFill) progressFill.style.width = `${pct}%`;

        if (status.status === 'completed') {
          isCompleted = true;
          if (progressText) progressText.textContent = `✓ Selesai! ${total} saham di ${groupName} telah dianalisis.`;
          if (progressFill) progressFill.style.width = '100%';

          showToast(`Batch analisis ${groupName} selesai! (${total} saham)`, 'success');

          setTimeout(() => {
            if (progressBox) progressBox.style.display = 'none';
          }, 3500);

          await Promise.allSettled([
            loadWatchlist(),
            loadLatestAnalyses(),
          ]);
          break;
        } else if (status.status === 'failed') {
          isCompleted = true;
          showToast(`Batch analisis gagal`, 'error');
          if (progressBox) progressBox.style.display = 'none';
          break;
        }
      } catch (e) {
        // Polling retry
      }
    }

    if (!isCompleted && progressBox) {
      progressBox.style.display = 'none';
    }

  } catch (err) {
    showToast(`Gagal memulai batch analisis: ${err.message}`, 'error');
    const progressBox = document.getElementById('dashboard-progress-box');
    if (progressBox) progressBox.style.display = 'none';
  } finally {
    isBatchRunning = false;
  }
};

window.selectGroupToPicker = function (stockCodesJsonEncoded) {
  try {
    const codes = JSON.parse(decodeURIComponent(stockCodesJsonEncoded));
    window.__preselectedStocks = codes;
    showToast(`${codes.length} saham ditandai untuk Pemilihan Saham`, 'info');
    window.navigateTo('stock-picker');
  } catch (err) {
    console.error(err);
  }
};

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
