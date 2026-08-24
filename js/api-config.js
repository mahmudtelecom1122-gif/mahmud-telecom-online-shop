// Mahmud Telecom — Cloud Sync API configuration
// GitHub Pages, custom domains and other frontend hosts use the live Render API.
// When the frontend is served by the Render backend itself, same-origin API is used.
const MT_RENDER_API='https://mahmud-telecom-online-shop-1.onrender.com';
window.MT_API_BASE = location.hostname.endsWith('onrender.com') ? '' : MT_RENDER_API;
