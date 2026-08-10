// app/api/cron/log-bandwidth-usage/route.ts
// Dipanggil terjadwal tiap ~15 menit - catat pemakaian bandwidth per pelanggan
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { getQueueStats } from "@/lib/mikrotik/client";
import { getRouterConfigByLokasi } from "@/lib/mikrotik/get-router-config";

export async function GET() {
  const { data: pelanggan } = await supabase
    .from("pelanggan")
    .select("id, mikrotik_queue_target, lokasi_id")
    .not("mikrotik_queue_target", "is", null);

  const results: Record<string, string>[] = [];

  for (const p of pelanggan ?? []) {
    try {
      const routerConfig = await getRouterConfigByLokasi(p.lokasi_id);
      const stats = await getQueueStats(routerConfig, p.mikrotik_queue_target);

      if (stats) {
        await supabase.from("log_bandwidth").insert({
          pelanggan_id: p.id,
          upload_bytes: stats.bytesUpload,
          download_bytes: stats.bytesDownload,
        });
      }
    } catch (err) {
      results.push({ pelangganId: p.id, message: `error: ${(err as Error).message}` });
    }
  }

  return NextResponse.json({ checked: pelanggan?.length ?? 0, results });
}