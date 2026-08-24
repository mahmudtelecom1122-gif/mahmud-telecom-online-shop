# Mahmud Telecom V16

Final mobile banking save/delete and cloud synchronization repair.

- Clock runs in Asia/Dhaka.
- Mobile banking save/edit/delete uses one direct form submit handler.
- LocalStorage is written before cloud synchronization.
- Cloud sync uses persistent three-way merge so records do not reappear after delete.
- Render API merges concurrent JSON state updates on the server.
- Cache/version bumped to V16.


V18 Cloud Sync: base-aware merge preserves new saves and correctly propagates deletions across devices without resurrecting deleted records.
