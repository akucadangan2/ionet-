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
  setPPPoEStatus,
  setBandwidthQueue,
  getWirelessRegistrationTable,
  getActivePPPoEConnections,
  getQueueStats,
  getAllPPPoESecrets,
  pingGatewayViaInterface,
  getActiveHotspotUsers,
  monitorInterfaceTraffic,
};