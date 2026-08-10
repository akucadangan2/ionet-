// app/api/cron/auto-disable-modem/route.ts
// Dipanggil terjadwal tiap hari (misal jam 00:05) - cek pelanggan yang lewat jatuh tempo
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { setPPPoEStatus } from "@/lib/mikrotik/client";
import { getRouterConfigByLokasi } from "@/lib/mikrotik/get-router-config";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const results: Record<string, string>[] = [];

  // Ambil pelanggan yang: lewat jatuh tempo, masih aktif, dan disable_otomatis = true
  // (disable_otomatis ini flag per-pelanggan buat exception - sesuai requirement
  // client: bisa custom per pelanggan tertentu, bukan cuma "semua sekaligus")
  const { data: pelangganLewatTempo, error } = await supabase
    .from("pelanggan")
    .select("*, lokasi_id")
    .eq("tipe_langganan", "pppoe_bulanan")
    .eq("status", "aktif")
    .eq("disable_otomatis", true)
    .lt("tanggal_jatuh_tempo", today);

  if (error) {
    return NextResponse.json({ message: "gagal ambil data pelanggan", error }, { status: 500 });
  }

  for (const pelanggan of pelangganLewatTempo ?? []) {
    try {
      const routerConfig = await getRouterConfigByLokasi(pelanggan.lokasi_id);
      await setPPPoEStatus(routerConfig, pelanggan.pppoe_username, false);

      await supabase
        .from("pelanggan")
        .update({ status: "suspend" })
        .eq("id", pelanggan.id);

      results.push({ pelangganId: pelanggan.id, message: "modem di-disable (lewat jatuh tempo)" });
    } catch (err) {
      results.push({ pelangganId: pelanggan.id, message: `error: ${(err as Error).message}` });
    }
  }

  return NextResponse.json({ diproses: pelangganLewatTempo?.length ?? 0, results });
}