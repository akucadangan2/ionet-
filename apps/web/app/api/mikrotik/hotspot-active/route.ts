import { NextRequest, NextResponse } from "next/server";

const RELAY_URL = process.env.MIKROTIK_RELAY_URL!;
const RELAY_TOKEN = process.env.MIKROTIK_RELAY_TOKEN!;

export async function GET(req: NextRequest) {
  try {
    const routerId = req.nextUrl.searchParams.get("routerId");
    const res = await fetch(`${RELAY_URL}/mikrotik/hotspot-active?routerId=${routerId}`, {
      headers: { Authorization: `Bearer ${RELAY_TOKEN}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `Relay error: ${res.status}`);
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}