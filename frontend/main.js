/**
 * InsightSaham — Main Application Entry Point
 * Handles routing and page navigation.
 */

// Current page state
let currentPage = 'dashboard';
let currentPageArg = null;

// Navigate to a page
window.navigateTo = function (page, arg = null) {
  currentPage = page;
  currentPageArg = arg;

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Render page
  renderCurrentPage();
};

async function renderCurrentPage() {
  const container = document.getElementById('main-content');

  switch (currentPage) {
    case 'dashboard': {
      const { renderDashboard } = await import('./pages/dashboard.js');
      await renderDashboard(container);
      break;
    }
    case 'stock-picker': {
      const { renderStockPicker } = await import('./pages/stock-picker.js');
      await renderStockPicker(container);
      break;
    }
    case 'analysis-detail': {
      const { renderAnalysisDetail } = await import('./pages/analysis-detail.js');
      await renderAnalysisDetail(container, currentPageArg);
      break;
    }
    case 'archive': {
      const { renderArchive } = await import('./pages/archive.js');
      await renderArchive(container);
      break;
    }
    case 'settings': {
      const { renderSettings } = await import('./pages/settings.js');
      await renderSettings(container);
      break;
    }
    default: {
      container.innerHTML = `<div class="empty-state"><h3>Halaman tidak ditemukan</h3></div>`;
    }
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Set up nav click handlers
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      if (page) {
        window.navigateTo(page);
      }
    });
  });

  // Render initial page
  renderCurrentPage();
});
