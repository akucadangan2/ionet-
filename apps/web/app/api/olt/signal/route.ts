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
      return NextResponse.json({ signals: [], mapPoints: [], message: "Belum ada router dengan OLT vendor diset" });
    }

    const vendorResult = await supabase
      .from("olt_vendor_config")
      .select("oid_nama, oid_rx_power, power_divisor, status")
      .eq("vendor", routerResult.data.olt_vendor)
      .single();

    if (!vendorResult.data || !vendorResult.data.oid_rx_power) {
      return NextResponse.json({ signals: [], mapPoints: [], message: "Konfigurasi OID vendor ini belum tersedia" });
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
    if (!res.ok) throw new Error(json.message || `Relay error: ${res.status}`);

    const signals = json.signals || [];

    // Cocokkan nama ONU ke pppoe_username pelanggan yang punya titik GPS,
    // biar bisa diplot di peta. ONU dengan nama cuma angka index (nggak match
    // ke username manapun) otomatis dilewatin dari mapPoints - wajar terjadi.
    const { data: pelangganList } = await supabase
      .from("pelanggan")
      .select("id, nama, latitude, longitude, pppoe_username")
      .not("latitude", "is", null)
      .not("pppoe_username", "is", null);

    const pelangganByUsername: Record<string, any> = {};
    (pelangganList || []).forEach((p) => {
      if (p.pppoe_username) {
        pelangganByUsername[p.pppoe_username.toLowerCase()] = p;
      }
    });

    const mapPoints: any[] = [];
    signals.forEach((s: any) => {
      if (!s.name) return;
      const match = pelangganByUsername[s.name.toLowerCase()];
      if (match) {
        mapPoints.push({
          id: match.id,
          nama: match.nama,
          latitude: match.latitude,
          longitude: match.longitude,
          status: "-",
          rxPower: s.rxPowerDbm,
          signalStatus: s.rxPowerDbm === null ? undefined : s.rxPowerDbm < -25 ? "lemah" : "normal",
        });
      }
    });

    return NextResponse.json({ signals, mapPoints });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}