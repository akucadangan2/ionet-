// src/db/index.js
const Database = require("better-sqlite3");
const path = require("path");

let db;

function initDb() {
  db = new Database(path.join(__dirname, "../../local-backup.db"));

  db.exec(`
    CREATE TABLE IF NOT EXISTS local_transaksi_voucher (
      id TEXT PRIMARY KEY,
      paket_voucher_id TEXT,
      no_hp_pembeli TEXT,
      nominal_dibayar REAL,
      metode TEXT,
      kode_voucher TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS local_pelanggan_cache (
      id TEXT PRIMARY KEY,
      nama TEXT,
      pppoe_username TEXT,
      status TEXT,
      tanggal_jatuh_tempo TEXT,
      cached_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      synced INTEGER DEFAULT 0,
      last_error TEXT
    );
  `);

  return db;
}

function getDb() {
  if (!db) throw new Error("Database belum di-init, panggil initDb() dulu");
  return db;
}

module.exports = { initDb, getDb };