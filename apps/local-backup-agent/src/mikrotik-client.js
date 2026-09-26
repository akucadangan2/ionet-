// src/mikrotik-client.js
// Versi JS dari lib/mikrotik/client.ts - dipakai di sini karena local-backup-agent
// jalan sebagai plain Node.js, dan dia yang punya akses LOKAL ke Mikrotik
const { RouterOSAPI } = require("node-routeros");

async function getConnection(config) {
  const conn = new RouterOSAPI({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port || 8728,
    timeout: 30, // detik - dinaikin dari default (kemungkinan 10 detik), biar ga gampang timeout kalau router lagi sibuk
  });
  await conn.connect();
  return conn;
}

async function addHotspotUser(config, username, password, profile, limitUptime, limitBytesTotal) {
  const conn = await getConnection(config);
  try {
    const params = [`=name=${username}`, `=password=${password}`, `=profile=${profile}`];
    if (limitUptime) params.push(`=limit-uptime=${limitUptime}`);
    if (limitBytesTotal) params.push(`=limit-bytes-total=${limitBytesTotal}`);
    await conn.write("/ip/hotspot/user/add", params);
  } finally {
    conn.close();
  }
}

// Versi BULK - buka 1 koneksi doang, dipakai bareng buat semua voucher dalam
// 1 batch. Ini jauh lebih ringan buat router dibanding buka-tutup koneksi
// per voucher (yang bikin timeout kalau router lagi sibuk, karena tiap
// koneksi baru butuh proses login dari nol).
async function addHotspotUsersBulk(config, users) {
  const conn = await getConnection(config);
  const hasil = [];
  try {
    for (const u of users) {
      try {
        const params = [`=name=${u.username}`, `=password=${u.password}`, `=profile=${u.profile}`];
        if (u.limitUptime) params.push(`=limit-uptime=${u.limitUptime}`);
        if (u.limitBytesTotal) params.push(`=limit-bytes-total=${u.limitBytesTotal}`);
        await conn.write("/ip/hotspot/user/add", params);
        hasil.push({ username: u.username, success: true });
      } catch (err) {
        hasil.push({ username: u.username, success: false, error: err.message });
      }
    }
  } finally {
    conn.close();
  }
  return hasil;
}

async function setPPPoEStatus(config, pppoeUser, enabled) {
  const conn = await getConnection(config);
  try {
    const secrets = await conn.write("/ppp/secret/print", [`?name=${pppoeUser}`]);
    if (!secrets.length) throw new Error(`PPPoE user ${pppoeUser} tidak ditemukan`);
    const id = secrets[0][".id"];
    await conn.write("/ppp/secret/set", [`=.id=${id}`, `=disabled=${enabled ? "no" : "yes"}`]);
    if (!enabled) {
      const active = await conn.write("/ppp/active/print", [`?name=${pppoeUser}`]);
      if (active.length) {
        await conn.write("/ppp/active/remove", [`=.id=${active[0][".id"]}`]);
      }
    }
  } finally {
    conn.close();
  }
}

async function getPppoeProfile(config, pppoeUser) {
  const conn = await getConnection(config);
  try {
    const secrets = await conn.write("/ppp/secret/print", [`?name=${pppoeUser}`]);
    if (!secrets.length) throw new Error(`PPPoE user ${pppoeUser} tidak ditemukan`);
    return secrets[0].profile;
  } finally {
    conn.close();
  }
}

async function setPppoeProfile(config, pppoeUser, profileName) {
  const conn = await getConnection(config);
  try {
    const secrets = await conn.write("/ppp/secret/print", [`?name=${pppoeUser}`]);
    if (!secrets.length) throw new Error(`PPPoE user ${pppoeUser} tidak ditemukan`);
    const id = secrets[0][".id"];
    await conn.write("/ppp/secret/set", [`=.id=${id}`, `=profile=${profileName}`]);

    // paksa reconnect biar profile baru langsung kepake, nggak nunggu renegosiasi
    const active = await conn.write("/ppp/active/print", [`?name=${pppoeUser}`]);
    if (active.length) {
      await conn.write("/ppp/active/remove", [`=.id=${active[0][".id"]}`]);
    }
  } finally {
    conn.close();
  }
}

async function setBandwidthQueue(config, target, uploadLimit, downloadLimit) {
  const conn = await getConnection(config);
  try {
    const existing = await conn.write("/queue/simple/print", [`?name=${target}`]);
    const maxLimit = `${uploadLimit}/${downloadLimit}`;
    if (existing.length) {
      await conn.write("/queue/simple/set", [`=.id=${existing[0][".id"]}`, `=max-limit=${maxLimit}`]);
    } else {
      await conn.write("/queue/simple/add", [`=name=${target}`, `=target=${target}`, `=max-limit=${maxLimit}`]);
    }
  } finally {
    conn.close();
  }
}

async function getWirelessRegistrationTable(config) {
  const conn = await getConnection(config);
  try {
    return await conn.write("/interface/wireless/registration-table/print");
  } finally {
    conn.close();
  }
}

async function getActivePPPoEConnections(config) {
  const conn = await getConnection(config);
  try {
    return await conn.write("/ppp/active/print");
  } finally {
    conn.close();
  }
}

async function getQueueStats(config, target) {
  const conn = await getConnection(config);
  try {
    const queues = await conn.write("/queue/simple/print", [`?target=${target}`]);
    if (!queues.length) return null;
    const bytesParts = (queues[0]["bytes"] || "0/0").split("/");
    return {
      bytesUpload: Number(bytesParts[0] || 0),
      bytesDownload: Number(bytesParts[1] || 0),
      maxLimit: queues[0]["max-limit"],
    };
  } finally {
    conn.close();
  }
}

async function getAllPPPoESecrets(config) {
  const conn = await getConnection(config);
  try {
    return await conn.write("/ppp/secret/print");
  } finally {
    conn.close();
  }
}

async function pingGatewayViaInterface(config, interfaceName, gatewayIp) {
  const conn = await getConnection(config);
  try {
    const results = await conn.write("/ping", [
      "=address=" + gatewayIp,
      "=interface=" + interfaceName,
      "=count=3",
    ]);

    let received = 0;
    results.forEach(function (r) {
      if (r.time && !r.timeout) {
        received = received + 1;
      }
    });

    return { reachable: received > 0, packetsReceived: received };
  } finally {
    conn.close();
  }
}

async function pingWithStats(config, interfaceName, targetIp, count) {
  const conn = await getConnection(config);
  try {
    const results = await conn.write("/ping", [
      "=address=" + targetIp,
      "=interface=" + interfaceName,
      "=count=" + (count || 5),
    ]);

    let received = 0;
    let totalTime = 0;
    let times = [];

    results.forEach(function (r) {
      if (r.time && !r.timeout) {
        received++;
        const rawMicroseconds = parseFloat(String(r.time).replace("ms", "").replace("us", "")) || 0;
        const ms = rawMicroseconds / 1000;
        times.push(ms);
        totalTime += ms;
      }
    });

    const sent = count || 5;
    const packetLoss = Math.round(((sent - received) / sent) * 100);
    const avgLatency = received > 0 ? Math.round(totalTime / received) : null;

    return {
      sent: sent,
      received: received,
      packetLossPercent: packetLoss,
      avgLatencyMs: avgLatency,
    };
  } finally {
    conn.close();
  }
}

async function getActiveHotspotUsers(config) {
  const conn = await getConnection(config);
  try {
    return await conn.write("/ip/hotspot/active/print");
  } finally {
    conn.close();
  }
}

async function monitorInterfaceTraffic(config, interfaceName) {
  const conn = await getConnection(config);
  try {
    const result = await conn.write("/interface/monitor-traffic", [
      "=interface=" + interfaceName,
      "=once=",
    ]);
    return result[0] || {};
  } finally {
    conn.close();
  }
}

module.exports = {
  addHotspotUser,
  addHotspotUsersBulk,
  setPPPoEStatus,
  getPppoeProfile,
  setPppoeProfile,
  setBandwidthQueue,
  getWirelessRegistrationTable,
  getActivePPPoEConnections,
  getQueueStats,
  getAllPPPoESecrets,
  pingGatewayViaInterface,
  getActiveHotspotUsers,
  monitorInterfaceTraffic,
  pingWithStats,
};