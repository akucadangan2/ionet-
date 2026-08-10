// app/api/cron/monitor-routers/route.ts
// Dipanggil terjadwal tiap ~1 menit - cek konektivitas tiap router
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { getActivePPPoEConnections } from "@/lib/mikrotik/client";
import { createTicketIfNotExists } from "@/lib/tickets/create-ticket";

const THRESHOLD_MENIT = 7;

export async function GET() {
  const { data: routers } = await supabase
    .from("router")
    .select("*, lokasi_id");

  const results: Record<string, string>[] = [];

  for (const router of routers ?? []) {
    let isReachable = true;
    try {
      // Coba hit API Mikrotik - kalau berhasil connect & query, berarti online
      await getActivePPPoEConnections({
        host: router.ip_address,
        user: router.api_username,
        password: router.api_password,
      });
    } catch {
      isReachable = false;
    }

    const now = new Date();

    if (isReachable) {
      await supabase
        .from("router")
        .update({ status: "online", last_seen_at: now.toISOString() })
        .eq("id", router.id);
      continue;
    }

    // Nggak reachable - cek udah berapa lama sejak terakhir online
    const lastSeen = router.last_seen_at ? new Date(router.last_seen_at) : now;
    const menitOffline = (now.getTime() - lastSeen.getTime()) / 1000 / 60;

    if (menitOffline >= THRESHOLD_MENIT && router.status !== "offline") {
      await supabase.from("router").update({ status: "offline" }).eq("id", router.id);

      const ticketResult = await createTicketIfNotExists({
        lokasiId: router.lokasi_id,
        routerId: router.id,
        jenis: "offline",
        deskripsi: `Router "${router.nama}" offline lebih dari ${THRESHOLD_MENIT} menit`,
      });

      results.push({ routerId: router.id, message: ticketResult.message ?? "tiket dibuat" });
    }
    // Kalau belum lewat 7 menit, biarin dulu (masih dianggap blip sementara)
  }

  return NextResponse.json({ checked: routers?.length ?? 0, results });
}