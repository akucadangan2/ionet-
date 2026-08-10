// app/api/snmp/olt-signal/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { getOpticalPower } from "@/lib/snmp/client";
import { createTicketIfNotExists } from "@/lib/tickets/create-ticket";

const THRESHOLD_RX_DBM = -27;
const THRESHOLD_MENIT = 7;

export async function GET() {
  const { data: pelangganFiber } = await supabase
    .from("pelanggan")
    .select("id, nama, lokasi_id, onu_index, olt_ip, sinyal_lemah_since")
    .not("onu_index", "is", null);

  const results: Record<string, unknown>[] = [];

  for (const p of pelangganFiber ?? []) {
    try {
      const { rxPower, txPower } = await getOpticalPower({ oltIp: p.olt_ip }, p.onu_index);

      await supabase.from("log_sinyal_olt").insert({
        pelanggan_id: p.id,
        rx_power: rxPower,
        tx_power: txPower,
      });

      const now = new Date();
      const sinyalLemah = rxPower < THRESHOLD_RX_DBM;

      if (sinyalLemah) {
        if (!p.sinyal_lemah_since) {
          // pertama kali kedeteksi lemah, catat waktunya
          await supabase
            .from("pelanggan")
            .update({ sinyal_lemah_since: now.toISOString() })
            .eq("id", p.id);
        } else {
          const menitLemah = (now.getTime() - new Date(p.sinyal_lemah_since).getTime()) / 1000 / 60;
          if (menitLemah >= THRESHOLD_MENIT) {
            const ticketResult = await createTicketIfNotExists({
              lokasiId: p.lokasi_id,
              pelangganId: p.id,
              jenis: "sinyal_lemah",
              deskripsi: `Sinyal lemah pelanggan "${p.nama}" (Rx: ${rxPower} dBm) lebih dari ${THRESHOLD_MENIT} menit`,
            });
            results.push({ pelangganId: p.id, message: ticketResult.message ?? "tiket dibuat" });
          }
        }
      } else if (p.sinyal_lemah_since) {
        // sinyal udah normal lagi, reset tracking
        await supabase.from("pelanggan").update({ sinyal_lemah_since: null }).eq("id", p.id);
      }
    } catch (err) {
      results.push({ pelangganId: p.id, message: `error: ${(err as Error).message}` });
    }
  }

  return NextResponse.json({ checked: pelangganFiber?.length ?? 0, results });
}