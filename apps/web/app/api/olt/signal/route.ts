import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

const RELAY_URL = process.env.MIKROTIK_RELAY_URL!;
const RELAY_TOKEN = process.env.MIKROTIK_RELAY_TOKEN!;

export async function GET() {
  try {
    const routerResult = await supabase
      .from("router")
      .select("id, olt_vendor")
      .not("olt_vendor", "is", null)
      .limit(1)
      .single();

    if (!routerResult.data) {
      return NextResponse.json({ signals: [], message: "Belum ada router dengan OLT vendor diset" });
    }
.
    const vendorResult = await supabase
      .from("olt_vendor_config")
      .select("oid_nama, oid_rx_power, power_divisor, status")
      .eq("vendor", routerResult.data.olt_vendor)
      .single();

    if (!vendorResult.data || !vendorResult.data.oid_rx_power) {
      return NextResponse.json({ signals: [], message: "Konfigurasi OID vendor ini belum tersedia" });
    }

    const cfg = vendorResult.data    const params = new URLSearchParams({
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
    if (!res.ok) throw new Error(json.message || `Relay error: ${res.status}`);

    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}