// src/sync/index.js
const { getDb } = require("../db");

const CENTRAL_SYNC_URL = process.env.CENTRAL_SYNC_URL;
const LOCAL_AGENT_TOKEN = process.env.LOCAL_AGENT_TOKEN;

async function isCentralReachable() {
  try {
    const res = await fetch(`${CENTRAL_SYNC_URL}/api/sync/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function syncToCentral() {
  const db = getDb();
  const reachable = await isCentralReachable();

  if (!reachable) {
    return { synced: 0, message: "central tidak reachable, coba lagi nanti" };
  }

  const pending = db.getPendingSyncItems(50);
  let syncedCount = 0;
  const errors = [];

  for (const item of pending) {
    try {
      const res = await fetch(`${CENTRAL_SYNC_URL}/api/sync/receive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOCAL_AGENT_TOKEN}`,
        },
        body: JSON.stringify({
          table: item.table_name,
          recordId: item.record_id,
          payload: JSON.parse(item.payload),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      db.markSynced(item.id);
      syncedCount++;
    } catch (err) {
      db.markSyncError(item.id, err.message);
      errors.push({ id: item.id, error: err.message });
    }
  }

  return { synced: syncedCount, total: pending.length, errors };
}

function startAutoSync(intervalMs = 60000) {
  setInterval(async () => {
    const result = await syncToCentral();
    if (result.synced > 0) {
      console.log(`[sync] berhasil sync ${result.synced} data ke central`);
    }
  }, intervalMs);
}

module.exports = { syncToCentral, startAutoSync, isCentralReachable };