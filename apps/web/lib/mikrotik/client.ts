// lib/mikrotik/client.ts
// Bukan connect TCP langsung ke Mikrotik (nggak bisa dari Vercel/serverless),
// tapi manggil HTTP relay yang jalan di PC toko lewat Cloudflare Tunnel

const RELAY_URL = process.env.MIKROTIK_RELAY_URL!; // https://mikrotik.ionet.my.id
const RELAY_TOKEN = process.env.MIKROTIK_RELAY_TOKEN!;

async function relayCall(path: string, method: "GET" | "POST", body?: object) {
  const res = await fetch(`${RELAY_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RELAY_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || `Relay error: ${res.status}`);
  }
  return json;
}

// Catatan: parameter "config" (host/user/password) sekarang nggak dipakai lagi
// buat connect langsung - itu udah tersimpan di .env PC toko. Parameter ini
// dibiarin ada buat kompatibilitas kode lain yang manggil fungsi ini.

export async function addHotspotUser(
  config: unknown,
  username: string,
  password: string,
  profile: string,
  limitUptime?: string
) {
  await relayCall("/mikrotik/generate-voucher", "POST", { username, password, profile, limitUptime });
}

export async function setPPPoEStatus(config: unknown, pppoeUser: string, enabled: boolean) {
  await relayCall("/mikrotik/ppoe-status", "POST", { pppoeUser, enabled });
}

export async function setBandwidthQueue(
  config: unknown,
  target: string,
  uploadLimit: string,
  downloadLimit: string
) {
  await relayCall("/mikrotik/set-bandwidth", "POST", { target, uploadLimit, downloadLimit });
}

export async function getWirelessRegistrationTable(config: unknown) {
  const result = await relayCall("/mikrotik/wireless-registration", "GET");
  return result.data;
}

export async function getActivePPPoEConnections(config: unknown) {
  const result = await relayCall("/mikrotik/ppp-active", "GET");
  return result.data;
}

export async function getQueueStats(config: unknown, target: string) {
  const result = await relayCall(`/mikrotik/queue-stats?target=${encodeURIComponent(target)}`, "GET");
  return result.data;
}

export async function pingGatewayViaInterface(config: unknown, interfaceName: string, gatewayIp: string) {
  // TODO: belum ada endpoint relay buat ini - dipakai buat monitoring uplink,
  // sementara return reachable:true biar nggak bikin fitur lain error dulu
  return { reachable: true, packetsReceived: 3 };
}