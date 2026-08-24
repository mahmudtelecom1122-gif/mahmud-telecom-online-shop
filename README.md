# Mahmud Telecom Professional ERP

PDF-inspired responsive ERP interface for Mahmud Telecom.

## Included
- Responsive desktop sidebar + mobile bottom navigation
- Dashboard with sales, due, collection and profit overview
- Sales, purchases, products/stock, customers, suppliers
- Due collection, mobile recharge and mobile banking
- Reports with print and PNG export
- Sales receipt with print and PNG export
- Dark mode, settings, JSON backup/import, localStorage persistence
- PWA/service-worker shell for GitHub Pages

## GitHub Pages
Upload the contents of this folder to the repository root. Then enable GitHub Pages from **Settings → Pages → Deploy from a branch → main → / (root)**.

## Important
GitHub Pages is static hosting. This build keeps a local backup but also connects to the live Render API for shared cloud data. The same account/site data can therefore be read from PC, laptop and mobile as long as they use the same deployed site and the Render database is healthy.


### Receipt PNG
Mobile Banking and Mobile Recharge-এর রসিদে Print ও PNG অপশন আছে। PNG বাটন শুধু রসিদ কার্ডটিই PNG হিসেবে সেভ করে; পুরো ওয়েবপেজ সেভ হয় না। Chrome automatic download বন্ধ থাকলে PNG প্রস্তুত হওয়ার পর “PNG সংরক্ষণ করুন” বাটন থেকে হাতে সেভ করা যাবে।


## Final fixes in this build
- সব পেজে Print + PNG + প্রয়োজনীয় “সব মুছুন” নিয়ন্ত্রণ যোগ করা হয়েছে।
- Modal-এর “বাতিল” বোতাম ও ESC/Backdrop close নির্ভরযোগ্য করা হয়েছে।
- Mobile Recharge ও Mobile Banking-এ তারিখ, পরিশোধ, বাকি এবং বাকি আদায় যোগ হয়েছে।
- নম্বর হিসাবের আলাদা পেজ, রসিদ, PNG, এডিট, বাকি আদায় ও ডিলিট যোগ হয়েছে।
- Recharge/Banking/Number লেনদেনের তারিখ এখন সংরক্ষিত হয়; আগের তারিখও এডিট করা যায়।
- Service-worker cache version v10 করা হয়েছে যাতে পুরোনো JavaScript আটকে না থাকে।
- বাংলা লেখার জন্য Unicode Bengali font stack ও বড় font size ব্যবহার করা হয়েছে। “Bijoy 52” নিজে একটি Unicode web-font নয়; SutonnyMJ/Bijoy 52 থাকলে fallback হিসেবে নেওয়া হবে।
- এই ZIP নিজে cloud database তৈরি করে না। একই ব্রাউজারের localStorage ডাটা একই ব্রাউজারের tab-এ sync হবে; PC ও মোবাইলের মধ্যে automatic shared হিসাবের জন্য API/backend connection প্রয়োজন।

## V11 Cloud Sync
- Added `server.js` + `package.json` for PostgreSQL-backed shared state.
- Added `js/api-config.js` so GitHub Pages connects to the Render API automatically.
- Frontend keeps a local backup and asynchronously syncs the complete ERP state to `/api/state`.
- The backend creates `mahmud_telecom_state` automatically using the Render `DATABASE_URL` environment variable.
- Deploy the project on Render with Build Command `npm install` and Start Command `npm start`.
- Keep the PostgreSQL `DATABASE_URL` in Render Environment Variables. Never put the database password in frontend code.


## V12 Cloud Sync + Clock Fix
- Fixed the dashboard clock (`clockText`) with Bangladesh time and live seconds.
- Fixed the Mobile Recharge form crash caused by an undefined variable.
- Fixed dropdown editing so saved Recharge/Banking values remain selected.
- Added continuous cloud polling every 5 seconds plus three-way merge logic to prevent one device from overwriting another device's newer records during normal use.
- Added persistent cloud base snapshots so changes made while a device was temporarily offline can be merged after reconnection.
- Added automatic retry when the Render service wakes up or the network comes back.
- Updated the service-worker cache version to v12 and removed older Mahmud Telecom caches during activation.
- The API now returns `updated_at` after a successful cloud save.


## V13 Final fixes
- Clock is initialized directly from index.html as well as app.js, so it cannot remain `--:--` due to a later rendering error.
- Service worker is network-first for HTML/JS/CSS to prevent stale GitHub Pages code.
- Cloud startup merges local and remote records instead of blindly replacing local data with the remote snapshot.


## V14 fixes
- Mobile Banking add/save/delete handlers hardened.
- Local save now persists before rendering/cloud sync.
- Cache bumped to V14 to prevent stale app.js.
