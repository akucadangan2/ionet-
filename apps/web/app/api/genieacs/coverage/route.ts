import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

const NBI_URL = process.env.GENIEACS_NBI_URL!;

function extractPppoeUsername(device: any): string | null {
  const igd = device.InternetGatewayDevice || {};
  const wan = igd.WANDevice || {};
  for (const wanKey in wan) {
    if (wanKey.startsWith("_")) continue;
    const wcd = wan[wanKey].WANConnectionDevice || {};
    for (const wcdKey in wcd) {
      if (wcdKey.startsWith("_")) continue;
      const ppp = wcd[wcdKey].WANPPPConnection || {};
      for (const pppKey in ppp) {
        if (pppKey.startsWith("_")) continue;
        const uname = ppp[pppKey].Username?._value;
        if (uname) return uname;
      }
    }
  }
  return null;
}

export async function GET() {
  try {
    const { data: pelangganList } = await supabase
      .from("pelanggan")
      .select("id, nama, pppoe_username")
      .not("pppoe_username", "is", null);

    const res = await fetch(`${NBI_URL}/devices`, { cache: "no-store" });
    const devices = await res.json();

    const genieacsUsernames = new Set<string>();
    devices.forEach((d: any) => {
      const uname = extractPppoeUsername(d);
      if (uname) genieacsUsernames.add(uname.toLowerCase());
    });

    const sudah: { nama: string; pppoe_username: string }[] = [];
    const belum: { nama: string; pppoe_username: string }[] = [];

    (pelangganList || []).forEach((p) => {
      const uname = (p.pppoe_username || "").toLowerCase();
      if (genieacsUsernames.has(uname)) {
        sudah.push({ nama: p.nama, pppoe_username: p.pppoe_username });
      } else {
        belum.push({ nama: p.nama, pppoe_username: p.pppoe_username });
      }
    });

    return NextResponse.json({
      totalPelanggan: pelangganList?.length || 0,
      totalDeviceGenieacs: devices.length,
      totalTeridentifikasi: genieacsUsernames.size,
      sudah,
      belum,
    });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}