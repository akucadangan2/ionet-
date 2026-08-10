// app/api/cron/monitor-uplinks/route.ts
// Dipanggil terjadwal tiap ~1 menit - cek tiap uplink (ISP/Starlink) per lokasi secara terpisah
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { pingGatewayViaInterface } from "@/lib/mikrotik/client";
import { createTicketIfNotExists } from "@/lib/tickets/create-ticket";
import { getRouterConfigByLokasi } from "@/lib/mikrotik/get-router-config";

const THRESHOLD_MENIT = 7;

export async function GET() {
  const { data: uplinks } = await supabase
    .from("uplink")
    .select("*, lokasi:lokasi_id(*)");

  const results: Record<string, string>[] = [];

  for (const uplink of uplinks ?? []) {
    if (!uplink.interface_mikrotik || !uplink.interface_gateway) continue;

    let reachable = true;
    try {
      const routerConfig = await getRouterConfigByLokasi(uplink.lokasi_id);
      const pingResult = await pingGatewayViaInterface(
        routerConfig,
        uplink.interface_mikrotik,
        uplink.interface_gateway
      );
      reachable = pingResult.reachable;
    } catch {
      reachable = false;
    }

    const now = new Date();

    if (reachable) {
      await supabase
        .from("uplink")
        .update({ status: "online", last_seen_at: now.toISOString() })
        .eq("id", uplink.id);
      continue;
    }

    const lastSeen = uplink.last_seen_at ? new Date(uplink.last_seen_at) : now;
    const menitOffline = (now.getTime() - lastSeen.getTime()) / 1000 / 60;

    if (menitOffline >= THRESHOLD_MENIT && uplink.status !== "offline") {
      await supabase.from("uplink").update({ status: "offline" }).eq("id", uplink.id);

      const ticketResult = await createTicketIfNotExists({
        lokasiId: uplink.lokasi_id,
        sumberUplinkId: uplink.id,
        jenis: "bandwidth",
        deskripsi: `Uplink "${uplink.nama}" di lokasi "${uplink.lokasi?.nama}" terputus lebih dari ${THRESHOLD_MENIT} menit`,
      });

      results.push({ uplinkId: uplink.id, message: ticketResult.message ?? "tiket dibuat" });
    }
  }

  return NextResponse.json({ checked: uplinks?.length ?? 0, results });
}