import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

const RELAY_URL = process.env.MIKROTIK_RELAY_URL!;
const RELAY_TOKEN = process.env.MIKROTIK_RELAY_TOKEN!;

export async function GET() {
  try {
    const { data: uplinkList, error } = await supabase
      .from("uplink")
      .select("id, nama, interface_mikrotik, kapasitas_mbps, status, lokasi_id, router:lokasi_id(id)")
      .order("nama");

    if (error) throw new Error(error.message);

    const routerResult = await supabase.from("router").select("id, lokasi_id");
    const routerByLokasi: Record<string, string> = {};
    (routerResult.data || []).forEach((r) => {
      routerByLokasi[r.lokasi_id] = r.id;
    });

    const results = [];

    for (const uplink of uplinkList || []) {
      const routerId = routerByLokasi[uplink.lokasi_id];
      if (!routerId || !uplink.interface_mikrotik) {
        results.push({
          nama: uplink.nama,
          kapasitasMbps: uplink.kapasitas_mbps,
          status: uplink.status,
          downloadMbps: null,
          uploadMbps: null,
          error: "Router atau interface belum diset",
        });
        continue;
      }

      try {
        const res = await fetch(
          `${RELAY_URL}/mikrotik/interface-traffic?routerId=${routerId}&interfaceName=${uplink.interface_mikrotik}`,
          { headers: { Authorization: `Bearer ${RELAY_TOKEN}` } }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);

        const rxBps = Number(json.data["rx-bits-per-second"]) || 0;
        const txBps = Number(json.data["tx-bits-per-second"]) || 0;

        results.push({
          nama: uplink.nama,
          kapasitasMbps: uplink.kapasitas_mbps,
          status: uplink.status,
          downloadMbps: Math.round((rxBps / 1000000) * 10) / 10,
          uploadMbps: Math.round((txBps / 1000000) * 10) / 10,
          error: null,
        });
      } catch (err) {
        results.push({
          nama: uplink.nama,
          kapasitasMbps: uplink.kapasitas_mbps,
          status: uplink.status,
          downloadMbps: null,
          uploadMbps: null,
          error: (err as Error).message,
        });
      }
    }

    return NextResponse.json({ uplinks: results });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}