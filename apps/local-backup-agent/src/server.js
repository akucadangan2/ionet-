// src/server.js
const express = require("express");
const crypto = require("crypto");
const { initDb, getDb } = require("./db");
const { syncToCentral, startAutoSync, isCentralReachable } = require("./sync");

const app = express();
app.use(express.json());

initDb();
startAutoSync();

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/sync-status", async (req, res) => {
  const db = getDb();
  const pending = db.prepare("SELECT COUNT(*) as count FROM sync_queue WHERE synced = 0").get();
  const reachable = await isCentralReachable();
  res.json({ centralReachable: reachable, pendingSync: pending.count });
});

app.post("/sync-now", async (req, res) => {
  const result = await syncToCentral();
  res.json(result);
});

// Dipanggil pas ada transaksi voucher (tunai/manual) saat koneksi central mungkin lagi putus
app.post("/transaksi-voucher", (req, res) => {
  const db = getDb();
  const { paketVoucherId, noHpPembeli, nominalDibayar, metode, kodeVoucher } = req.body;
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO local_transaksi_voucher
    (id, paket_voucher_id, no_hp_pembeli, nominal_dibayar, metode, kode_voucher)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, paketVoucherId, noHpPembeli, nominalDibayar, metode, kodeVoucher);

  db.prepare(`
    INSERT INTO sync_queue (table_name, record_id, payload)
    VALUES (?, ?, ?)
  `).run(
    "transaksi_voucher",
    id,
    JSON.stringify({ id, paketVoucherId, noHpPembeli, nominalDibayar, metode, kodeVoucher })
  );

  res.json({ id, message: "transaksi disimpan lokal, akan disync begitu koneksi normal" });
});

const PORT = process.env.LOCAL_AGENT_PORT || 4000;
app.listen(PORT, () => console.log(`local-backup-agent running on port ${PORT}`));