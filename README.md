# Mahmud Telecom V21

Final mobile banking save/delete and cloud synchronization repair.

- Clock runs in Asia/Dhaka.
- Mobile banking save/edit/delete uses one direct form submit handler.
- LocalStorage is written before cloud synchronization.
- Cloud sync uses persistent three-way merge so records do not reappear after delete.
- Render API merges concurrent JSON state updates on the server.
- Cache/version bumped to V16.


V18 Cloud Sync: base-aware merge preserves new saves and correctly propagates deletions across devices without resurrecting deleted records.


## V20 Cloud Sync Fix
- Added per-record mutation timestamps (`_mt`).
- Added deletion tombstones (`_deleted`) so deleted transactions cannot return from another device.
- Laptop and mobile changes are merged by mutation time.
- Mobile Banking Save/Edit/Delete uses the same durable local + cloud save path.
- **Both GitHub Pages and Render must be deployed from this version.**


## V21 Cloud Sync Fix
- Fixed first-device/new-browser startup: when cloud data already exists, built-in demo/default browser data no longer overwrites the cloud copy.
- A new mobile or laptop now pulls the existing PostgreSQL/Render state first.
- Existing unsynced local data can still be merged when the browser contains real local changes.
- Service-worker cache bumped to V21.
