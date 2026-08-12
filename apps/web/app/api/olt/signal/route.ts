import { NextResponse } from "next/server";

const RELAY_URL = process.env.MIKROTIK_RELAY_URL!;
const RELAY_TOKEN = process.env.MIKROTIK_RELAY_TOKEN!;

export async function GET() {
  try {
    const res = await fetch(`${RELAY_URL}/snmp/olt-signal?host=192.168.44.102&community=public`, {
      headers: { Authorization: `Bearer ${RELAY_TOKEN}` },
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || `Relay error: ${res.status}`);
    }
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}