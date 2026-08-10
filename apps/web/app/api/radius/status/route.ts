// app/api/radius/status/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET() {
  const { data: routers } = await supabase
    .from("router")
    .select("id, nama, ip_address, radius_registered, status, lokasi:lokasi_id(nama)");

  // Hitung sesi aktif per NAS (accounting - baru berfungsi setelah FreeRADIUS
  // dikonfigurasi kirim data ke tabel radacct ini, lihat docs/setup-radius-accounting.md)
  const { data: activeSessions } = await supabase
    .from("radacct")
    .select("nasipaddress")
    .is("acctstoptime", null);

  const sessionCountByNas: Record<string, number> = {};
  for (const s of activeSessions ?? []) {
    sessionCountByNas[s.nasipaddress] = (sessionCountByNas[s.nasipaddress] ?? 0) + 1;
  }

  const result = (routers ?? []).map((r: any) => ({
    ...r,
    activeSessions: sessionCountByNas[r.ip_address] ?? 0,
  }));

  return NextResponse.json({ routers: result });
}