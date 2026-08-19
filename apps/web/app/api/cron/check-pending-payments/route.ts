// app/api/cron/check-pending-payments/route.ts
// Dipanggil terjadwal (misal tiap 1-2 menit lewat Vercel Cron / cron-job.org)
// buat jaga-jaga kalau webhook DOKU tidak fire (lesson dari Maesa Mart)
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { checkStatus } from "@/lib/doku/client";
import { processPaymentSuccess } from "@/lib/payment/process-payment";

export async function GET() {
  const results: Record<string, string>[] = [];

  const { data: pendingVouchers } = await supabase
    .from("transaksi_voucher")
    .select("id")
    .eq("status", "pending");

  const { data: pendingMonthly } = await supabase
    .from("pembayaran_bulanan")
    .select("id")
    .eq("status", "pending");

  const allPending = [
    ...(pendingVouchers ?? []),
    ...(pendingMonthly ?? []),
  ];

  for (const item of allPending) {
    try {
      const dokuStatus = await checkStatus(item.id);
      if (dokuStatus?.transaction?.status === "SUCCESS") {
        const result = await processPaymentSuccess(item.id);
        results.push({ orderId: item.id, ...result });
      }
    } catch (err) {
      // satu order gagal dicek, jangan hentikan loop buat order lain
      results.push({ orderId: item.id, message: `error: ${(err as Error).message}` });
    }
  }

  return NextResponse.json({ checked: allPending.length, results });
}