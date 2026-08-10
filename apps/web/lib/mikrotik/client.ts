// lib/mikrotik/client.ts
import { RouterOSAPI } from "node-routeros";

interface MikrotikConfig {
  host: string;
  user: string;
  password: string;
  port?: number;
}

async function getConnection(config: MikrotikConfig): Promise<RouterOSAPI> {
  const conn = new RouterOSAPI({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port || 8728,
  });
  await conn.connect();
  return conn;
}

// Generate voucher hotspot (dipanggil setelah pembayaran voucher terkonfirmasi)
export async function addHotspotUser(
  config: MikrotikConfig,
  username: string,
  password: string,
  profile: string,
  limitUptime?: string
) {
  const conn = await getConnection(config);
  try {
    const params = [
      `=name=${username}`,
      `=password=${password}`,
      `=profile=${profile}`,
    ];
    if (limitUptime) params.push(`=limit-uptime=${limitUptime}`);
    await conn.write("/ip/hotspot/user/add", params);
  } finally {
    conn.close();
  }
}

// Enable/disable PPPoE (dipakai buat auto-disable jatuh tempo & aktivasi manual)
export async function setPPPoEStatus(
  config: MikrotikConfig,
  pppoeUser: string,
  enabled: boolean
) {
  const conn = await getConnection(config);
  try {
    const secrets = await conn.write("/ppp/secret/print", [`?name=${pppoeUser}`]);
    if (!secrets.length) throw new Error(`PPPoE user ${pppoeUser} tidak ditemukan`);

    const id = secrets[0][".id"];
    await conn.write("/ppp/secret/set", [
      `=.id=${id}`,
      `=disabled=${enabled ? "no" : "yes"}`,
    ]);

    // kalau di-disable & lagi konek, putus paksa biar langsung ke-apply
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

// Set queue bandwidth uplink/downlink per pelanggan
export async function setBandwidthQueue(
  config: MikrotikConfig,
  target: string, // IP atau PPPoE queue target pelanggan
  uploadLimit: string, // misal "2M"
  downloadLimit: string // misal "5M"
) {
  const conn = await getConnection(config);
  try {
    const existing = await conn.write("/queue/simple/print", [`?name=${target}`]);
    const maxLimit = `${uploadLimit}/${downloadLimit}`;

    if (existing.length) {
      await conn.write("/queue/simple/set", [
        `=.id=${existing[0][".id"]}`,
        `=max-limit=${maxLimit}`,
      ]);
    } else {
      await conn.write("/queue/simple/add", [
        `=name=${target}`,
        `=target=${target}`,
        `=max-limit=${maxLimit}`,
      ]);
    }
  } finally {
    conn.close();
  }
}

// Buat monitoring: baca status koneksi wireless (dipakai buat cek sinyal + online/offline)
export async function getWirelessRegistrationTable(config: MikrotikConfig) {
  const conn = await getConnection(config);
  try {
    return await conn.write("/interface/wireless/registration-table/print");
  } finally {
    conn.close();
  }
}

// Buat monitoring: baca koneksi PPPoE yang lagi aktif
export async function getActivePPPoEConnections(config: MikrotikConfig) {
  const conn = await getConnection(config);
  try {
    return await conn.write("/ppp/active/print");
  } finally {
    conn.close();
  }
}

// Tambahan buat lib/mikrotik/client.ts - baca statistik queue (usage bandwidth)
export async function getQueueStats(config: MikrotikConfig, target: string) {
  const conn = await getConnection(config);
  try {
    const queues = await conn.write("/queue/simple/print", [`?target=${target}`]);
    if (!queues.length) return null;

    return {
      bytesUpload: Number(queues[0]["bytes"]?.split("/")[0] ?? 0),
      bytesDownload: Number(queues[0]["bytes"]?.split("/")[1] ?? 0),
      maxLimit: queues[0]["max-limit"],
    };
  } finally {
    conn.close();
  }
}

// Tambahan buat lib/mikrotik/client.ts - cek konektivitas per uplink (ping ke gateway-nya)
export async function pingGatewayViaInterface(
  config: MikrotikConfig,
  interfaceName: string,
  gatewayIp: string
) {
  const conn = await getConnection(config);
  try {
    const result = await conn.write("/ping", [
      `=address=${gatewayIp}`,
      `=interface=${interfaceName}`,
      "=count=3",
    ]);

    const received = result.filter((r: any) => r["seq"] !== undefined && r["time"] !== undefined);
    return { reachable: received.length > 0, packetsReceived: received.length };
  } finally {
    conn.close();
  }
}