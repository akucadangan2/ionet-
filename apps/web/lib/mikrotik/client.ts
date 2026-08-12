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
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || `Relay error: ${res.status}`);
  }
  return json;
}

export async function addHotspotUser(
  routerId: string,
  username: string,
  password: string,
  profile: string,
  limitUptime?: string
) {
  await relayCall("/mikrotik/generate-voucher", "POST", { routerId, username, password, profile, limitUptime });
}

export async function setPPPoEStatus(routerId: string, pppoeUser: string, enabled: boolean) {
  await relayCall("/mikrotik/ppoe-status", "POST", { routerId, pppoeUser, enabled });
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