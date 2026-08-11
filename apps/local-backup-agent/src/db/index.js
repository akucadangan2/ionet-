// src/db/index.js
// Ganti dari SQLite ke JSON file biasa - nggak perlu compile native module
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../local-backup.json");

function loadData() {
  if (!fs.existsSync(DB_PATH)) {
    return { transaksi_voucher: [], sync_queue: [] };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function saveData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    saveData({ transaksi_voucher: [], sync_queue: [] });
  }
  return true;
}

const db = {
  insertTransaksi(record) {
    const data = loadData();
    data.transaksi_voucher.push({ ...record, created_at: new Date().toISOString() });
    saveData(data);
  },

  insertSyncQueue(tableName, recordId, payload) {
    const data = loadData();
    const id = data.sync_queue.length ? Math.max(...data.sync_queue.map((s) => s.id)) + 1 : 1;
    data.sync_queue.push({
      id,
      table_name: tableName,
      record_id: recordId,
      payload: JSON.stringify(payload),
      created_at: new Date().toISOString(),
      synced: 0,
      last_error: null,
    });
    saveData(data);
    return id;
  },

  getPendingSyncItems(limit = 50) {
    const data = loadData();
    return data.sync_queue
      .filter((item) => item.synced === 0)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(0, limit);
  },

  markSynced(id) {
    const data = loadData();
    const item = data.sync_queue.find((s) => s.id === id);
    if (item) item.synced = 1;
    saveData(data);
  },

  markSyncError(id, errorMessage) {
    const data = loadData();
    const item = data.sync_queue.find((s) => s.id === id);
    if (item) item.last_error = errorMessage;
    saveData(data);
  },

  countPending() {
    const data = loadData();
    return data.sync_queue.filter((item) => item.synced === 0).length;
  },
};

function getDb() {
  return db;
}

module.exports = { initDb, getDb };