import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/wa-gateway/client";
import { getActiveContacts } from "@/lib/notifications/get-contacts";

const RELAY_URL = process.env.MIKROTIK_RELAY_URL!;
const RELAY_TOKEN = process.env.MIKROTIK_RELAY_TOKEN!;
const OFFLINE_THRESHOLD_MENIT = 5;

export async function GET() {
  try {
    const uplinkResult = await supabase
      .from("uplink")
      .select("id, nama, interface_mikrotik, status, lokasi_id, last_seen_at");

    const routerResult = await supabase.from("router").select("id, lokasi_id");
    const routerByLokasi: Record<string, string> = {};
    (routerResult.data || []).forEach((r) => {
      routerByLokasi[r.lokasi_id] = r.id;
    });

    let logged = 0;
    let notified = 0;

    for (const uplink of uplinkResult.data || []) {
      const routerId = routerByLokasi[uplink.lokasi_id];
      if (!routerId || !uplink.interface_mikrotik) continue;

      let downloadMbps: number | null = null;
      let uploadMbps: number | null = null;
      let reachable = false;

      try {
        const res = await fetch(
          `${RELAY_URL}/mikrotik/interface-traffic?routerId=${routerId}&interfaceName=${uplink.interface_mikrotik}`,
          { headers: { Authorization: `Bearer ${RELAY_TOKEN}` } }
        );
        const json = await res.json();
        if (res.ok && json.data) {
          const rxBps = Number(json.data["rx-bits-per-second"]) || 0;
          const txBps = Number(json.data["tx-bits-per-second"]) || 0;
          downloadMbps = Math.round((rxBps / 1000000) * 10) / 10;
          uploadMbps = Math.round((txBps / 1000000) * 10) / 10;
          reachable = true;
        }
      } catch {
        reachable = false;
      }

      if (reachable) {
        await supabase.from("log_uplink_traffic").insert({
          uplink_id: uplink.id,
          download_mbps: downloadMbps,
          upload_mbps: uploadMbps,
        });
        logged++;

        const kapasitas = Number(uplink.kapasitas_mbps) || 0;
        const persenPemakaian = kapasitas > 0 ? ((downloadMbps || 0) / kapasitas) * 100 : 0;

        if (persenPemakaian >= 80) {
          const lastWarnKey = "warn_capacity_" + uplink.id;
          const { data: lastWarn } = await supabase
            .from("app_state")
            .select("value, updated_at")
            .eq("key", lastWarnKey)
            .maybeSingle();

          const menitSejakWarnTerakhir = lastWarn
            ? (Date.now() - new Date(lastWarn.updated_at).getTime()) / 1000 / 60
            : 999;

          if (menitSejakWarnTerakhir >= 30) {
            const adminContacts = await getActiveContacts("admin");
            for (const contact of adminContacts) {
              try {
                await sendWhatsApp(
                  contact.no_hp,
                  `Peringatan: pemakaian jalur "${uplink.nama}" sudah ${persenPemakaian.toFixed(0)}% dari kapasitas (${downloadMbps} Mbps dari ${kapasitas} Mbps).`
                );
              } catch (waErr) {
                console.error("Gagal kirim WA peringatan kapasitas:", waErr);
              }
            }

            await supabase
              .from("app_state")
              .upsert({ key: lastWarnKey, value: "warned", updated_at: new Date().toISOString() }, { onConflict: "key" });
          }
        }

        if (uplink.status === "offline") {
          const { data: openGangguan } = await supabase
            .from("riwayat_gangguan_uplink")
            .select("id, waktu_mulai")
            .eq("uplink_id", uplink.id)
            .is("waktu_selesai", null)
            .order("waktu_mulai", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (openGangguan) {
            const durasiMenit = (Date.now() - new Date(openGangguan.waktu_mulai).getTime()) / 1000 / 60;
            await supabase
              .from("riwayat_gangguan_uplink")
              .update({
                waktu_selesai: new Date().toISOString(),
                durasi_menit: Math.round(durasiMenit),
              })
              .eq("id", openGangguan.id);
          }
        }

        await supabase
          .from("uplink")
          .update({ status: "online", last_seen_at: new Date().toISOString() })
          .eq("id", uplink.id);
      } else {
        const lastSeen = uplink.last_seen_at ? new Date(uplink.last_seen_at) : new Date();
        const menitOffline = (Date.now() - lastSeen.getTime()) / 1000 / 60;

        if (menitOffline >= OFFLINE_THRESHOLD_MENIT && uplink.status !== "offline") {
          await supabase.from("uplink").update({ status: "offline" }).eq("id", uplink.id);

          await supabase.from("riwayat_gangguan_uplink").insert({
            uplink_id: uplink.id,
            waktu_mulai: lastSeen.toISOString(),
          });

          const adminContacts = await getActiveContacts("admin");
          for (const contact of adminContacts) {
            try {
              await sendWhatsApp(
                contact.no_hp,
                `Peringatan: jalur "${uplink.nama}" terputus lebih dari ${OFFLINE_THRESHOLD_MENIT} menit.`
              );
              notified++;
            } catch (waErr) {
              console.error("Gagal kirim WA:", waErr);
            }
          }
        }
      }
    }

    return NextResponse.json({ logged, notified });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}