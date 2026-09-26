// lib/mikrotik/client.ts
const RELAY_URL = process.env.MIKROTIK_RELAY_URL!;
const RELAY_TOKEN = process.env.MIKROTIK_RELAY_TOKEN!;

async function relayCall(path: string, method: "GET" | "POST", body?: object) {
  const res = await fetch(`${RELAY_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RELAY_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(35000),
  });

  const responseText = await res.text();

  if (!res.ok) {
    throw new Error(`Relay error (status ${res.status}): ${responseText.slice(0, 300)}`);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(`Relay balikin respons bukan JSON (status ${res.status}): ${responseText.slice(0, 300)}`);
  }
}

export async function addHotspotUser(
  routerId: string,
  username: string,
  password: string,
  profile: string,
  limitUptime?: string,
  limitBytesTotal?: number
) {
  await relayCall("/mikrotik/generate-voucher", "POST", { routerId, username, password, profile, limitUptime, limitBytesTotal });
}

export interface HotspotUserBulkItem {
  username: string;
  password: string;
  profile: string;
  limitUptime?: string;
  limitBytesTotal?: number;
}

export interface HotspotUserBulkResult {
  username: string;
  success: boolean;
  error?: string;
}

export async function addHotspotUsersBulk(routerId: string, users: HotspotUserBulkItem[]): Promise<HotspotUserBulkResult[]> {
  const result = await relayCall("/mikrotik/generate-voucher-bulk", "POST", { routerId, users });
  return result.hasil;
}

export async function setPPPoEStatus(routerId: string, pppoeUser: string, enabled: boolean) {
  await relayCall("/mikrotik/ppoe-status", "POST", { routerId, pppoeUser, enabled });
}

export async function getPppoeProfile(routerId: string, pppoeUser: string): Promise<string> {
  const result = await relayCall(
    `/mikrotik/pppoe-profile?routerId=${routerId}&pppoeUser=${encodeURIComponent(pppoeUser)}`,
    "GET"
  );
  return result.profile;
}

export async function setPppoeProfile(routerId: string, pppoeUser: string, profileName: string) {
  await relayCall("/mikrotik/set-pppoe-profile", "POST", { routerId, pppoeUser, profileName });
}

export async function setBandwidthQueue(
  routerId: string,
  target: string,
  uploadLimit: string,
  downloadLimit: string
) {
  await relayCall("/mikrotik/set-bandwidth", "POST", { routerId, target, uploadLimit, downloadLimit });
}

export async function getWirelessRegistrationTable(routerId: string) {
  const result = await relayCall(`/mikrotik/wireless-registration?routerId=${routerId}`, "GET");
  return result.data;
}

export async function getActivePPPoEConnections(routerId: string) {
  const result = await relayCall(`/mikrotik/ppp-active?routerId=${routerId}`, "GET");
  return result.data;
}

export async function getQueueStats(routerId: string, target: string) {
  const result = await relayCall(
    `/mikrotik/queue-stats?routerId=${routerId}&target=${encodeURIComponent(target)}`,
    "GET"
  );
  return result.data;
}

export async function pingGatewayViaInterface(routerId: string, interfaceName: string, gatewayIp: string) {
  const result = await relayCall("/mikrotik/ping-gateway", "POST", { routerId, interfaceName, gatewayIp });
  return result;
}