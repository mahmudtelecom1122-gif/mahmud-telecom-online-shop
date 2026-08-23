// Mahmud Telecom — Cloud Sync API configuration
// GitHub Pages uses the Render API; when frontend + backend are deployed together, same-origin API is used.
window.MT_API_BASE = location.hostname.endsWith('github.io')
  ? 'https://mahmud-telecom-online-shop-1.onrender.com'
  : '';
