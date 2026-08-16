import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

const RELAY_URL = process.env.MIKROTIK_RELAY_URL!;
const RELAY_TOKEN = process.env.MIKROTIK_RELAY_TOKEN!;

export async function GET() {
  try {
    const routerResult = await supabase
      .from("router")
      .select("id, nama, olt_vendor")
      .not("olt_vendor", "is", null);

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const router of routerResult.data || []) {
      const vendorResult = await supabase
        .from("olt_vendor_config")
        .select("oid_nama, oid_rx_power, power_divisor, status")
        .eq("vendor", router.olt_vendor)
        .single();

      if (!vendorResult.data || !vendorResult.data.oid_rx_power) {
        continue;
      }

      const cfg = vendorResult.data;
      const params = new URLSearchParams({
        host: "192.168.44.102",
        community: "public",
        oidRxPower: cfg.oid_rx_power,
        powerDivisor: String(cfg.power_divisor),
      });
      if (cfg.oid_nama) params.set("oidNama", cfg.oid_nama);

      const res = await fetch(`${RELAY_URL}/snmp/olt-signal?${params.toString()}`, {
        headers: { Authorization: `Bearer ${RELAY_TOKEN}` },
      });
      const json = await res.json();
      if (!res.ok) continue;

      const signals = json.signals || [];

      const { data: pelangganList } = await supabase
        .from("pelanggan")
        .select("id, pppoe_username")
        .not("pppoe_username", "is", null);

      const usernameMap: Record<string, string> = {};
      (pelangganList || []).forEach((p) => {
        if (p.pppoe_username) usernameMap[p.pppoe_username.toLowerCase()] = p.id;
      });

      for (const signal of signals) {
        if (!signal.name) { totalSkipped++; continue; }
        const pelangganId = usernameMap[signal.name.toLowerCase()];
        if (!pelangganId) { totalSkipped++; continue; }

        const { error } = await supabase.from("log_sinyal_olt").insert({
          pelanggan_id: pelangganId,
          rx_power: signal.rxPowerDbm,
          tx_power: null,
        });

        if (!error) totalInserted++;
        else totalSkipped++;
      }
    }

    return NextResponse.json({ inserted: totalInserted, skipped: totalSkipped });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}