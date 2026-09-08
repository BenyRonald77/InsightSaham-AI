/**
 * InsightSaham — Analysis Detail Page
 * Full analysis card view matching the reference card layout.
 */
import { api } from '../utils/api.js';
import {
  formatPrice, formatPercent, formatVolume, formatDate,
  formatIndicator, getPriceChangeClass, getTrendClass, safeNum
} from '../utils/formatters.js';

export async function renderAnalysisDetail(container, analysisId) {
  container.innerHTML = `
    <div class="page-loading">
      <div class="loading-spinner lg"></div>
      <span>Memuat analisis...</span>
    </div>
  `;

  try {
    const data = await api.getAnalysisDetail(analysisId);
    renderCard(container, data);
  } catch (err) {
    container.innerHTML = `
      <button class="btn-back" onclick="window.navigateTo('dashboard')">← Kembali</button>
      <div class="empty-state">
        <h3>Gagal memuat analisis</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

function renderCard(container, data) {
  const ind = data.indicators || {};
  const trend = data.trend || 'KONSOLIDASI';
  const trendReasons = data.trend_reasons || {};
  const resistance = data.resistance_levels || {};
  const support = data.support_levels || {};
  const scenarios = data.scenarios || {};
  const changeClass = getPriceChangeClass(data.price_change_pct);
  const trendClass = getTrendClass(trend);

  const trendDescMap = {
    'BULLISH': 'Tekanan Beli Meningkat',
    'BEARISH': 'Tekanan Jual Meningkat',
    'KONSOLIDASI': 'Menunggu Arah Selanjutnya',
  };

  container.innerHTML = `
    <button class="btn-back" onclick="window.navigateTo('dashboard')">
      ← Kembali ke Dashboard
    </button>

    <!-- HEADER -->
    <div class="analysis-detail-header">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:var(--space-md);">
        <div>
          <div class="detail-stock-code">${data.stock_code}</div>
          <div class="detail-stock-name">— ${data.stock_name}</div>
          <div class="detail-meta">
            <span>${data.sector}</span>
            <span>|</span>
            <span>IDX</span>
            <span>|</span>
            <span>Daily Chart</span>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.8rem; color:var(--text-muted);">Analisis untuk:</div>
          <div style="font-size:0.85rem; font-weight:600;">${formatDate(data.analysis_date)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">(Berdasarkan data penutupan ${formatDate(data.data_date)})</div>
          <div style="margin-top:8px; padding:6px 12px; background:var(--accent-primary-dim); border:1px solid var(--border-accent); border-radius:var(--radius-sm); font-size:0.72rem; color:var(--accent-primary); font-style:italic;">
            "Analisis Hari Ini,<br/>Untuk Belajar,<br/>Bukan untuk Rekomendasi!"
          </div>
        </div>
      </div>
    </div>

    <!-- TWO-COLUMN BODY -->
    <div class="analysis-detail-body">
      <!-- LEFT: Charts -->
      <div class="detail-charts">
        ${renderChartPlaceholder(data)}
      </div>

      <!-- RIGHT: Data Panels -->
      <div class="detail-panel">
        ${renderDataHariIni(data)}
        ${renderIndikatorUtama(ind)}
        ${renderTrendKondisi(trend, trendClass, trendDescMap[trend], trendReasons)}
        ${renderLevelPenting(resistance, support)}
      </div>
    </div>

    <!-- SCENARIOS -->
    ${renderScenarios(scenarios, data)}

    <!-- AI NARRATIVE -->
    ${data.narrative ? renderNarrative(data.narrative) : ''}

    <!-- DISCLAIMER -->
    ${renderDisclaimer()}
  `;

  // Initialize charts if chart_data is available
  if (data.chart_data) {
    setTimeout(() => {
      initCharts(data);
    }, 60);
  }
}

function renderChartPlaceholder(data) {
  return `
    <div class="chart-container" style="margin-bottom: var(--space-sm);">
      <div class="chart-label">${data.stock_code} · ${data.stock_name} · 1D · IDX</div>
      <div class="chart-area" id="main-chart"></div>
    </div>
    <div class="chart-container" style="margin-bottom: var(--space-sm);">
      <div class="chart-label">Volume 20</div>
      <div class="sub-chart-area" id="volume-chart"></div>
    </div>
    <div class="chart-container" style="margin-bottom: var(--space-sm);">
      <div class="chart-label">Stochastic 14,3,3</div>
      <div class="sub-chart-area" id="stoch-chart"></div>
    </div>
    <div class="chart-container" style="margin-bottom: var(--space-sm);">
      <div class="chart-label">MACD 12,26,9</div>
      <div class="sub-chart-area" id="macd-chart"></div>
    </div>
    <div class="chart-container">
      <div class="chart-label">Accumulation / Distribution</div>
      <div class="sub-chart-area" id="ad-chart"></div>
    </div>
  `;
}

function renderDataHariIni(data) {
  const change = data.price_change_pct || 0;
  const changeStr = `${formatPrice(data.close_price)} (${formatPercent(change)})`;

  return `
    <div class="panel-section">
      <div class="panel-section-header data-hari-ini">
        DATA HARI INI <span style="font-weight:400; font-size:0.7rem; margin-left:auto;">(${formatDate(data.data_date)})</span>
      </div>
      <div class="panel-section-body">
        <div class="data-row"><span class="label">● Open</span><span class="value text-mono">${formatPrice(data.open_price)}</span></div>
        <div class="data-row"><span class="label">● High</span><span class="value text-mono">${formatPrice(data.high_price)}</span></div>
        <div class="data-row"><span class="label">● Low</span><span class="value text-mono ${getPriceChangeClass(change)}">${formatPrice(data.low_price)}</span></div>
        <div class="data-row"><span class="label">● Close (Last)</span><span class="value text-mono ${getPriceChangeClass(change)}">${changeStr}</span></div>
        <div class="data-row"><span class="label">● Volume</span><span class="value text-mono">${formatVolume(data.volume)}</span></div>
        <div class="data-row"><span class="label">● MA20 Volume</span><span class="value text-mono">${formatVolume(data.volume_ma20)}</span></div>
      </div>
    </div>
  `;
}

function renderIndikatorUtama(ind) {
  const ema20Pos = ind.ema20 ? (ind.ema20 > 0 ? 'text-blue' : '') : '';

  return `
    <div class="panel-section">
      <div class="panel-section-header indikator">INDIKATOR UTAMA</div>
      <div class="panel-section-body">
        <div class="indicator-item">
          <div class="data-row">
            <span class="indicator-name">● EMA20</span>
            <span class="indicator-value text-blue">${formatIndicator(ind.ema20)} <span style="font-size:0.7rem;">(biru)</span></span>
          </div>
        </div>
        <div class="indicator-item">
          <div class="data-row">
            <span class="indicator-name">● EMA50</span>
            <span class="indicator-value text-bearish">${formatIndicator(ind.ema50)} <span style="font-size:0.7rem;">(merah)</span></span>
          </div>
        </div>
        ${ind.ema100 != null ? `
        <div class="indicator-item">
          <div class="data-row">
            <span class="indicator-name">● EMA100</span>
            <span class="indicator-value" style="color:#fff;">${formatIndicator(ind.ema100)} <span style="font-size:0.7rem;">(putih)</span></span>
          </div>
        </div>
        ` : ''}
        <div class="indicator-item">
          <div class="indicator-name">● Bollinger Bands :</div>
          <div style="padding-left: 16px; font-size:0.8rem;">
            <div class="data-row"><span class="label">Upper</span><span class="value text-mono">${formatIndicator(ind.bb_upper)} <span style="color:var(--text-muted); font-size:0.7rem;">(hijau)</span></span></div>
            <div class="data-row"><span class="label">Middle</span><span class="value text-mono">${formatIndicator(ind.bb_middle)}</span></div>
            <div class="data-row"><span class="label">Lower</span><span class="value text-mono">${formatIndicator(ind.bb_lower)} <span style="color:var(--text-muted); font-size:0.7rem;">(hijau)</span></span></div>
          </div>
        </div>
        <div class="indicator-item">
          <div class="indicator-name">● Stochastic (14,3,3) :</div>
          <div style="padding-left: 16px; font-size:0.8rem;">
            <div class="data-row"><span class="label">%K</span><span class="value text-mono">${formatIndicator(ind.stoch_k, 1)}</span></div>
            <div class="data-row"><span class="label">%D</span><span class="value text-mono">${formatIndicator(ind.stoch_d, 1)}</span></div>
          </div>
        </div>
        <div class="indicator-item">
          <div class="indicator-name">● MACD (12,26,9) :</div>
          <div style="padding-left: 16px; font-size:0.8rem;">
            <div class="data-row"><span class="label">MACD</span><span class="value text-mono">${formatIndicator(ind.macd_line, 2)}</span></div>
            <div class="data-row"><span class="label">Signal</span><span class="value text-mono">${formatIndicator(ind.macd_signal, 2)}</span></div>
            <div class="data-row"><span class="label">Histogram</span><span class="value text-mono">${formatIndicator(ind.macd_histogram, 2)}</span></div>
          </div>
        </div>
        <div class="indicator-item">
          <div class="data-row">
            <span class="indicator-name">● Accum/Dist</span>
            <span class="indicator-value text-mono">${formatVolume(ind.ad)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTrendKondisi(trend, trendClass, desc, reasons) {
  const reasonsList = reasons?.reasons || [];
  return `
    <div class="panel-section">
      <div class="panel-section-header trend-header">TREND & KONDISI</div>
      <div class="trend-display">
        <div class="trend-label ${trendClass}">${trend}</div>
        <div class="trend-description">(${desc})</div>
      </div>
      ${reasonsList.length > 0 ? `
      <ul class="trend-reasons">
        ${reasonsList.map(r => `<li>${r}</li>`).join('')}
      </ul>
      ` : ''}
    </div>
  `;
}

function renderLevelPenting(resistance, support) {
  return `
    <div class="panel-section">
      <div class="panel-section-header level-penting">LEVEL PENTING</div>
      <div class="levels-grid">
        <div class="levels-column">
          <div class="levels-column-title resistance">Resistance</div>
          ${Object.entries(resistance).map(([k, v]) =>
            `<div class="level-row"><span class="level-key">${k}</span><span style="color:var(--bearish);">${formatPrice(v)}</span></div>`
          ).join('')}
        </div>
        <div class="levels-column">
          <div class="levels-column-title support">Support</div>
          ${Object.entries(support).map(([k, v]) =>
            `<div class="level-row"><span class="level-key">${k}</span><span style="color:var(--bullish);">${formatPrice(v)}</span></div>`
          ).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderScenarios(scenarios, data) {
  if (!scenarios || !scenarios.intraday) return '';

  const intraday = scenarios.intraday || {};
  const intradayArea = scenarios.intraday_area || {};
  const swingArea = scenarios.swing_area || {};
  const teknikal = scenarios.teknikal || {};

  return `
    <div class="scenario-grid">
      <!-- Skenario Intraday -->
      <div class="scenario-card">
        <div class="scenario-header intraday">⚡ SKENARIO 1 HARI (INTRADAY)</div>
        <div class="scenario-body">
          <div class="scenario-item"><span class="scenario-label">Bias awal</span><span>${intraday.bias_awal || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Skenario bullish</span><span>${intraday.skenario_bullish || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Skenario konsolidasi</span><span>${intraday.skenario_konsolidasi || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Skenario bearish</span><span>${intraday.skenario_bearish || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Range hari ini</span><span class="fw-bold">${intraday.range_hari_ini || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Invalidasi</span><span class="text-bearish">${intraday.invalidasi || '-'}</span></div>
        </div>
      </div>

      <!-- Area Pengamatan Intraday -->
      <div class="scenario-card">
        <div class="scenario-header scalping">🔥 AREA PENGAMATAN INTRADAY (Scalping – Agresif)</div>
        <div class="scenario-body">
          <div class="scenario-item"><span class="scenario-label">Area pantau</span><span>${intradayArea.area_pantau || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Level potensi 1</span><span>${intradayArea.level_potensi_1 || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Level potensi 2</span><span>${intradayArea.level_potensi_2 || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Level risiko</span><span class="text-bearish">${intradayArea.level_risiko || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Konfirmasi</span><span>${intradayArea.konfirmasi || '-'}</span></div>
          <div style="margin-top:8px; font-size:0.75rem; color:var(--text-muted); font-style:italic;">${intradayArea.catatan || ''}</div>
        </div>
      </div>

      <!-- Area Pengamatan Swing -->
      <div class="scenario-card">
        <div class="scenario-header swing">📈 AREA PENGAMATAN SWING (Konservatif)</div>
        <div class="scenario-body">
          <div class="scenario-item"><span class="scenario-label">Area akumulasi</span><span>${swingArea.area_akumulasi || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Konfirmasi tren</span><span>${swingArea.konfirmasi_tren || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Target menengah</span><span class="text-bullish">${swingArea.target_menengah || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Batas risiko</span><span class="text-bearish">${swingArea.batas_risiko || '-'}</span></div>
          <div class="scenario-item"><span class="scenario-label">Syarat</span><span>${swingArea.syarat || '-'}</span></div>
        </div>
      </div>

      <!-- Skenario Teknikal -->
      <div class="scenario-card">
        <div class="scenario-header teknikal">🎯 SKENARIO TEKNIKAL</div>
        <div class="scenario-body">
          ${teknikal.bullish ? `
            <div style="margin-bottom:8px;">
              <div style="color:var(--bullish); font-weight:700; font-size:0.82rem;">▲ Skenario Bullish</div>
              <div style="font-size:0.8rem;">${teknikal.bullish.kondisi || '-'}<br/>Target: ${teknikal.bullish.target || '-'}</div>
            </div>
          ` : ''}
          ${teknikal.konsolidasi ? `
            <div style="margin-bottom:8px;">
              <div style="color:var(--neutral); font-weight:700; font-size:0.82rem;">↔ Skenario Konsolidasi</div>
              <div style="font-size:0.8rem;">${teknikal.konsolidasi.kondisi || '-'}<br/>${teknikal.konsolidasi.keterangan || ''}</div>
            </div>
          ` : ''}
          ${teknikal.bearish ? `
            <div>
              <div style="color:var(--bearish); font-weight:700; font-size:0.82rem;">▼ Skenario Bearish</div>
              <div style="font-size:0.8rem;">${teknikal.bearish.kondisi || '-'}<br/>Target: ${teknikal.bearish.target || '-'}</div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderNarrative(narrative) {
  return `
    <div class="narrative-section">
      <h3>🤖 Narasi AI</h3>
      <div class="narrative-text">${narrative}</div>
    </div>
  `;
}

function renderDisclaimer() {
  return `
    <div class="disclaimer-section">
      <div class="disclaimer-card">
        <div class="disclaimer-header risk">📋 MANAJEMEN RISIKO (EDUKASI)</div>
        <div class="disclaimer-body">
          <li>Gunakan manajemen risiko dalam setiap keputusan.</li>
          <li>Sesuaikan dengan profil risiko masing-masing.</li>
          <li>Jangan hanya mengandalkan satu indikator.</li>
          <li>Lakukan evaluasi ulang jika ada perubahan kondisi pasar.</li>
        </div>
      </div>
      <div class="disclaimer-card">
        <div class="disclaimer-header warning">⚠ CATATAN PENTING</div>
        <div class="disclaimer-body warning-body">
          <li>Analisis ini dibuat untuk tujuan edukasi dan pembelajaran analisis teknikal.</li>
          <li>Bukan merupakan ajakan atau rekomendasi untuk membeli/menjual saham.</li>
          <li>Setiap keputusan investasi/trading adalah tanggung jawab masing-masing.</li>
          <li>Skenario dapat berubah mengikuti kondisi pasar.</li>
        </div>
      </div>
    </div>
  `;
}

async function initCharts(data) {
  try {
    const { createChart } = await import('lightweight-charts');
    const chartData = data.chart_data;
    if (!chartData || !chartData.dates || chartData.dates.length === 0) return;

    const dates = chartData.dates;
    const ohlcv = chartData.ohlcv;
    if (!ohlcv || !ohlcv.close) return;

    // Theme options
    const chartOptions = {
      layout: {
        background: { color: '#141430' },
        textColor: '#9ca3af',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: false,
      },
    };

    const charts = [];
    const chartMap = new Map();

    const registerResize = (el, chart) => {
      chartMap.set(el, chart);
      charts.push(chart);
    };

    // === 1. MAIN CANDLESTICK CHART (Candles + EMAs + Bollinger Bands) ===
    const mainEl = document.getElementById('main-chart');
    let mainChart = null;
    if (mainEl) {
      mainEl.innerHTML = '';
      const w = mainEl.clientWidth || mainEl.parentElement?.clientWidth || 700;
      mainChart = createChart(mainEl, {
        ...chartOptions,
        height: 320,
        width: w,
      });
      registerResize(mainEl, mainChart);

      // Candlestick series
      const candleSeries = mainChart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });

      const candleData = dates.map((d, i) => ({
        time: d,
        open: Number(ohlcv.open[i]),
        high: Number(ohlcv.high[i]),
        low: Number(ohlcv.low[i]),
        close: Number(ohlcv.close[i]),
      })).filter(p => !isNaN(p.open) && !isNaN(p.high) && !isNaN(p.low) && !isNaN(p.close));
      candleSeries.setData(candleData);

      // Bollinger Bands Upper
      if (chartData.bb_upper) {
        const bbUpperSeries = mainChart.addLineSeries({
          color: 'rgba(34,197,94,0.45)', lineWidth: 1, priceLineVisible: false,
          title: 'BB Upper',
        });
        bbUpperSeries.setData(dates.map((d, i) => ({
          time: d, value: Number(chartData.bb_upper[i]),
        })).filter(p => !isNaN(p.value) && p.value > 0));
      }

      // Bollinger Bands Middle
      if (chartData.bb_middle) {
        const bbMidSeries = mainChart.addLineSeries({
          color: 'rgba(245,158,11,0.45)', lineWidth: 1, priceLineVisible: false,
          lineStyle: 2,
          title: 'BB Mid',
        });
        bbMidSeries.setData(dates.map((d, i) => ({
          time: d, value: Number(chartData.bb_middle[i]),
        })).filter(p => !isNaN(p.value) && p.value > 0));
      }

      // Bollinger Bands Lower
      if (chartData.bb_lower) {
        const bbLowerSeries = mainChart.addLineSeries({
          color: 'rgba(239,68,68,0.45)', lineWidth: 1, priceLineVisible: false,
          title: 'BB Lower',
        });
        bbLowerSeries.setData(dates.map((d, i) => ({
          time: d, value: Number(chartData.bb_lower[i]),
        })).filter(p => !isNaN(p.value) && p.value > 0));
      }

      // EMA20 (Blue)
      if (chartData.ema20) {
        const ema20Series = mainChart.addLineSeries({
          color: '#3b82f6', lineWidth: 1.5, priceLineVisible: false,
          title: 'EMA20',
        });
        ema20Series.setData(dates.map((d, i) => ({
          time: d, value: Number(chartData.ema20[i]),
        })).filter(p => !isNaN(p.value) && p.value > 0));
      }

      // EMA50 (Red)
      if (chartData.ema50) {
        const ema50Series = mainChart.addLineSeries({
          color: '#ef4444', lineWidth: 1.5, priceLineVisible: false,
          title: 'EMA50',
        });
        ema50Series.setData(dates.map((d, i) => ({
          time: d, value: Number(chartData.ema50[i]),
        })).filter(p => !isNaN(p.value) && p.value > 0));
      }

      // EMA100 (White dashed)
      if (chartData.ema100) {
        const ema100Series = mainChart.addLineSeries({
          color: '#ffffff', lineWidth: 1, priceLineVisible: false,
          lineStyle: 2,
          title: 'EMA100',
        });
        ema100Series.setData(dates.map((d, i) => ({
          time: d, value: Number(chartData.ema100[i]),
        })).filter(p => !isNaN(p.value) && p.value > 0));
      }

      mainChart.timeScale().fitContent();
    }

    // === 2. VOLUME CHART ===
    const volEl = document.getElementById('volume-chart');
    let volChart = null;
    if (volEl) {
      volEl.innerHTML = '';
      const w = volEl.clientWidth || volEl.parentElement?.clientWidth || 700;
      volChart = createChart(volEl, {
        ...chartOptions,
        height: 120,
        width: w,
      });
      registerResize(volEl, volChart);

      const volSeries = volChart.addHistogramSeries({
        priceFormat: { type: 'volume' },
      });

      volSeries.setData(dates.map((d, i) => ({
        time: d,
        value: Number(ohlcv.volume[i]) || 0,
        color: Number(ohlcv.close[i]) >= Number(ohlcv.open[i]) ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)',
      })).filter(p => !isNaN(p.value)));

      // Volume MA20
      if (chartData.volume_ma20) {
        const volMaSeries = volChart.addLineSeries({
          color: '#f59e0b', lineWidth: 1.5, priceLineVisible: false,
          title: 'Vol MA20',
        });
        volMaSeries.setData(dates.map((d, i) => ({
          time: d, value: Number(chartData.volume_ma20[i]),
        })).filter(p => !isNaN(p.value) && p.value > 0));
      }

      volChart.timeScale().fitContent();
    }

    // === 3. STOCHASTIC CHART ===
    const stochEl = document.getElementById('stoch-chart');
    let stochChart = null;
    if (stochEl && chartData.stoch_k) {
      stochEl.innerHTML = '';
      const w = stochEl.clientWidth || stochEl.parentElement?.clientWidth || 700;
      stochChart = createChart(stochEl, {
        ...chartOptions,
        height: 120,
        width: w,
      });
      registerResize(stochEl, stochChart);

      const kSeries = stochChart.addLineSeries({
        color: '#3b82f6', lineWidth: 1.5, priceLineVisible: false,
        title: '%K',
      });
      kSeries.setData(dates.map((d, i) => ({
        time: d, value: Number(chartData.stoch_k[i]),
      })).filter(p => !isNaN(p.value)));

      if (chartData.stoch_d) {
        const dSeries = stochChart.addLineSeries({
          color: '#ef4444', lineWidth: 1.5, priceLineVisible: false,
          title: '%D',
        });
        dSeries.setData(dates.map((d, i) => ({
          time: d, value: Number(chartData.stoch_d[i]),
        })).filter(p => !isNaN(p.value)));
      }

      stochChart.timeScale().fitContent();
    }

    // === 4. MACD CHART ===
    const macdEl = document.getElementById('macd-chart');
    let macdChart = null;
    if (macdEl && chartData.macd_line) {
      macdEl.innerHTML = '';
      const w = macdEl.clientWidth || macdEl.parentElement?.clientWidth || 700;
      macdChart = createChart(macdEl, {
        ...chartOptions,
        height: 120,
        width: w,
      });
      registerResize(macdEl, macdChart);

      const macdLineSeries = macdChart.addLineSeries({
        color: '#3b82f6', lineWidth: 1.5, priceLineVisible: false,
        title: 'MACD',
      });
      macdLineSeries.setData(dates.map((d, i) => ({
        time: d, value: Number(chartData.macd_line[i]),
      })).filter(p => !isNaN(p.value)));

      if (chartData.macd_signal) {
        const signalSeries = macdChart.addLineSeries({
          color: '#f59e0b', lineWidth: 1.5, priceLineVisible: false,
          title: 'Signal',
        });
        signalSeries.setData(dates.map((d, i) => ({
          time: d, value: Number(chartData.macd_signal[i]),
        })).filter(p => !isNaN(p.value)));
      }

      if (chartData.macd_histogram) {
        const histSeries = macdChart.addHistogramSeries({
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
          title: 'Hist',
        });
        histSeries.setData(dates.map((d, i) => ({
          time: d,
          value: Number(chartData.macd_histogram[i]),
          color: (Number(chartData.macd_histogram[i]) || 0) >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)',
        })).filter(p => !isNaN(p.value)));
      }

      macdChart.timeScale().fitContent();
    }

    // === 5. ACCUMULATION / DISTRIBUTION CHART ===
    const adEl = document.getElementById('ad-chart');
    let adChart = null;
    if (adEl && chartData.ad) {
      adEl.innerHTML = '';
      const w = adEl.clientWidth || adEl.parentElement?.clientWidth || 700;
      adChart = createChart(adEl, {
        ...chartOptions,
        height: 120,
        width: w,
      });
      registerResize(adEl, adChart);

      const adSeries = adChart.addLineSeries({
        color: '#a78bfa', lineWidth: 1.5, priceLineVisible: false,
        title: 'A/D',
      });
      adSeries.setData(dates.map((d, i) => ({
        time: d, value: Number(chartData.ad[i]),
      })).filter(p => !isNaN(p.value)));

      adChart.timeScale().fitContent();
    }

    // === SYNCHRONIZE TIME SCALES ACROSS ALL CHARTS ===
    let isSyncing = false;
    charts.forEach(chart => {
      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (isSyncing || !range) return;
        isSyncing = true;
        charts.forEach(other => {
          if (other !== chart) {
            try {
              other.timeScale().setVisibleLogicalRange(range);
            } catch (e) {}
          }
        });
        isSyncing = false;
      });
    });

    // === RESIZE OBSERVER ===
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const targetEl = entry.target;
        const newWidth = entry.contentRect.width;
        if (newWidth > 0) {
          const chartInstance = chartMap.get(targetEl);
          if (chartInstance) {
            chartInstance.applyOptions({ width: newWidth });
          }
        }
      }
    });

    [mainEl, volEl, stochEl, macdEl, adEl].filter(Boolean).forEach(el => {
      resizeObserver.observe(el);
    });

  } catch (err) {
    console.error('Chart init error:', err);
  }
}
