import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

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

    const signals = json.signals || [];

    const { data: pelangganList } = await supabase
      .from("pelanggan")
      .select("id, pppoe_username")
      .not("pppoe_username", "is", null);

    const usernameMap: Record<string, string> = {};
    (pelangganList || []).forEach((p) => {
      if (p.pppoe_username) {
        usernameMap[p.pppoe_username.toLowerCase()] = p.id;
      }
    });

    let inserted = 0;
    let skipped = 0;

    for (const signal of signals) {
      if (!signal.name) {
        skipped++;
        continue;
      }
      const pelangganId = usernameMap[signal.name.toLowerCase()];
      if (!pelangganId) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("log_sinyal_olt").insert({
        pelanggan_id: pelangganId,
        rx_power: signal.rxPowerDbm,
        tx_power: null,
      });

      if (!error) inserted++;
      else skipped++;
    }

    return NextResponse.json({ inserted, skipped, total: signals.length });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}