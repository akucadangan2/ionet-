// src/server.js
const express = require("express");
const crypto = require("crypto");
const { initDb, getDb } = require("./db");
const { syncToCentral, startAutoSync, isCentralReachable } = require("./sync");
const mikrotik = require("./mikrotik-client");

const app = express();
app.use(express.json());

initDb();
startAutoSync();

const LOCAL_AGENT_TOKEN = process.env.LOCAL_AGENT_TOKEN;
const MIKROTIK_HOST = process.env.MIKROTIK_HOST;
const MIKROTIK_USER = process.env.MIKROTIK_USER;
const MIKROTIK_PASSWORD = process.env.MIKROTIK_PASSWORD;
const MIKROTIK_PORT = process.env.MIKROTIK_PORT || 8728;

function mikrotikConfig() {
  return { host: MIKROTIK_HOST, user: MIKROTIK_USER, password: MIKROTIK_PASSWORD, port: Number(MIKROTIK_PORT) };
}

// Proteksi: semua endpoint /mikrotik/* wajib pakai token yang sama kayak LOCAL_AGENT_TOKEN
function checkAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${LOCAL_AGENT_TOKEN}`) {
    return res.status(401).json({ message: "unauthorized" });
  }
  next();
}

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

app.post("/transaksi-voucher", (req, res) => {
  const db = getDb();
  const { paketVoucherId, noHpPembeli, nominalDibayar, metode, kodeVoucher } = req.body;
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO local_transaksi_voucher
    (id, paket_voucher_id, no_hp_pembeli, nominal_dibayar, metode, kode_voucher)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, paketVoucherId, noHpPembeli, nominalDibayar, metode, kodeVoucher);

  db.prepare(`INSERT INTO sync_queue (table_name, record_id, payload) VALUES (?, ?, ?)`).run(
    "transaksi_voucher",
    id,
    JSON.stringify({ id, paketVoucherId, noHpPembeli, nominalDibayar, metode, kodeVoucher })
  );

  res.json({ id, message: "transaksi disimpan lokal, akan disync begitu koneksi normal" });
});

// ===== Relay ke Mikrotik (dipanggil dari Vercel lewat Cloudflare Tunnel) =====

app.post("/mikrotik/generate-voucher", checkAuth, async (req, res) => {
  try {
    const { username, password, profile, limitUptime } = req.body;
    await mikrotik.addHotspotUser(mikrotikConfig(), username, password, profile, limitUptime);
    res.json({ message: "voucher berhasil dibuat" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/mikrotik/ppoe-status", checkAuth, async (req, res) => {
  try {
    const { pppoeUser, enabled } = req.body;
    await mikrotik.setPPPoEStatus(mikrotikConfig(), pppoeUser, enabled);
    res.json({ message: "status PPPoE berhasil diubah" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/mikrotik/set-bandwidth", checkAuth, async (req, res) => {
  try {
    const { target, uploadLimit, downloadLimit } = req.body;
    await mikrotik.setBandwidthQueue(mikrotikConfig(), target, uploadLimit, downloadLimit);
    res.json({ message: "bandwidth berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/mikrotik/wireless-registration", checkAuth, async (req, res) => {
  try {
    const data = await mikrotik.getWirelessRegistrationTable(mikrotikConfig());
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/mikrotik/ppp-active", checkAuth, async (req, res) => {
  try {
    const data = await mikrotik.getActivePPPoEConnections(mikrotikConfig());
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/mikrotik/queue-stats", checkAuth, async (req, res) => {
  try {
    const { target } = req.query;
    const data = await mikrotik.getQueueStats(mikrotikConfig(), target);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.LOCAL_AGENT_PORT || 4000;
app.listen(PORT, () => console.log(`local-backup-agent running on port ${PORT}`));