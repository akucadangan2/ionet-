// src/server.js
const fs = require("fs");
const path = require("path");

// Load .env manual - biar jalan konsisten baik lewat "npm start" maupun
// lewat Windows Service (yang node-windows) yang nggak baca --env-file
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    value = value.replace(/^["']|["']$/g, ""); // buang tanda kutip kalau ada
    if (!process.env[key]) process.env[key] = value;
  });
}

const express = require("express");
const crypto = require("crypto");
const { initDb, getDb } = require("./db");
const { syncToCentral, startAutoSync, isCentralReachable } = require("./sync");
const mikrotik = require("./mikrotik-client");
const { snmpWalk } = require("./snmp-test");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const app = express();
app.use(express.json());

initDb();
startAutoSync();

const LOCAL_AGENT_TOKEN = process.env.LOCAL_AGENT_TOKEN;

async function getRouterConfig(routerId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/router?id=eq.${routerId}&select=ip_address,api_username,api_password`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  const data = await res.json();
  if (!data || !data.length) throw new Error(`Router ${routerId} tidak ditemukan`);

  return {
    host: data[0].ip_address,
    user: data[0].api_username,
    password: data[0].api_password,
    port: 8728,
  };
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
  const reachable = await isCentralReachable();
  res.json({ centralReachable: reachable, pendingSync: db.countPending() });
});

app.post("/sync-now", async (req, res) => {
  const result = await syncToCentral();
  res.json(result);
});

app.post("/transaksi-voucher", (req, res) => {
  const db = getDb();
  const { paketVoucherId, noHpPembeli, nominalDibayar, metode, kodeVoucher } = req.body;
  const id = crypto.randomUUID();

  db.insertTransaksi({ id, paketVoucherId, noHpPembeli, nominalDibayar, metode, kodeVoucher });
  db.insertSyncQueue("transaksi_voucher", id, { id, paketVoucherId, noHpPembeli, nominalDibayar, metode, kodeVoucher });

  res.json({ id, message: "transaksi disimpan lokal, akan disync begitu koneksi normal" });
});

// ===== Relay ke Mikrotik (dipanggil dari Vercel lewat Cloudflare Tunnel) =====

app.post("/mikrotik/generate-voucher", checkAuth, async (req, res) => {
  try {
    const { routerId, username, password, profile, limitUptime } = req.body;
    if (!routerId) throw new Error("routerId diperlukan");
    const config = await getRouterConfig(routerId);
    await mikrotik.addHotspotUser(config, username, password, profile, limitUptime);
    res.json({ message: "voucher berhasil dibuat" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/mikrotik/ppoe-status", checkAuth, async (req, res) => {
  try {
    const { routerId, pppoeUser, enabled } = req.body;
    if (!routerId) throw new Error("routerId diperlukan");
    const config = await getRouterConfig(routerId);
    await mikrotik.setPPPoEStatus(config, pppoeUser, enabled);
    res.json({ message: "status PPPoE berhasil diubah" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/mikrotik/set-bandwidth", checkAuth, async (req, res) => {
  try {
    const { routerId, target, uploadLimit, downloadLimit } = req.body;
    if (!routerId) throw new Error("routerId diperlukan");
    const config = await getRouterConfig(routerId);
    await mikrotik.setBandwidthQueue(config, target, uploadLimit, downloadLimit);
    res.json({ message: "bandwidth berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/mikrotik/wireless-registration", checkAuth, async (req, res) => {
  try {
    const { routerId } = req.query;
    if (!routerId) throw new Error("routerId diperlukan");
    const config = await getRouterConfig(routerId);
    const data = await mikrotik.getWirelessRegistrationTable(config);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/mikrotik/ppp-active", checkAuth, async (req, res) => {
  try {
    const { routerId } = req.query;
    if (!routerId) throw new Error("routerId diperlukan");
    const config = await getRouterConfig(routerId);
    const data = await mikrotik.getActivePPPoEConnections(config);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/mikrotik/ppp-secrets", checkAuth, async (req, res) => {
  try {
    const { routerId } = req.query;
    if (!routerId) throw new Error("routerId diperlukan");
    const config = await getRouterConfig(routerId);
    const data = await mikrotik.getAllPPPoESecrets(config);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/mikrotik/queue-stats", checkAuth, async (req, res) => {
  try {
    const { routerId, target } = req.query;
    if (!routerId) throw new Error("routerId diperlukan");
    const config = await getRouterConfig(routerId);
    const data = await mikrotik.getQueueStats(config, target);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/snmp/walk", checkAuth, async (req, res) => {
  try {
    const { host, community, oid } = req.query;
    const result = await snmpWalk(
      host || "192.168.44.102",
      community || "public",
      oid || "1.3.6.1.2.1.1" // OID standar "system" - buat tes awal doang
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.LOCAL_AGENT_PORT || 4000;
app.listen(PORT, () => console.log(`local-backup-agent running on port ${PORT}`));