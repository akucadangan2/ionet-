// app/api/cron/check-pending-payments/route.ts
// Dipanggil terjadwal (misal tiap 1-2 menit lewat Vercel Cron / cron-job.org)
// buat jaga-jaga kalau webhook DOKU tidak fire (lesson dari Maesa Mart)
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { checkStatus } from "@/lib/doku/client";
import { processPaymentSuccess } from "@/lib/payment/process-payment";

export const maxDuration = 30;

export async function GET() {
  // Cuma cek transaksi pending yang dibuat dalam 2 jam terakhir - transaksi
  // pending yang lebih lama dari itu praktis udah expired di sisi DOKU
  // (payment_due_date cuma 60 menit), jadi nggak perlu dicek terus-terusan.
  // Ini mencegah daftar "pending" numpuk jadi ratusan dan bikin loop timeout.
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: pendingVouchers } = await supabase
    .from("transaksi_voucher")
    .select("id")
    .eq("status", "pending")
    .gte("created_at", cutoff);

  const { data: pendingMonthly } = await supabase
    .from("pembayaran_bulanan")
    .select("id")
    .eq("status", "pending")
    .gte("created_at", cutoff);

  const allPending = [
    ...(pendingVouchers ?? []),
    ...(pendingMonthly ?? []),
  ];

  // Cek ke DOKU secara paralel, bukan satu-satu berurutan - biar 1 transaksi
  // yang lambat/gagal nggak nyandera pengecekan transaksi lain di belakangnya
  const settled = await Promise.allSettled(
    allPending.map(async (item) => {
      const dokuStatus = await checkStatus(item.id);
      if (dokuStatus?.transaction?.status === "SUCCESS") {
        const result = await processPaymentSuccess(item.id);
        return { orderId: item.id, ...result };
      }
      return { orderId: item.id, message: "belum lunas" };
    })
  );

  const results = settled.map((s, i) =>
    s.status === "fulfilled" ? s.value : { orderId: allPending[i].id, message: `error: ${s.reason?.message || s.reason}` }
  );

  return NextResponse.json({ checked: allPending.length, results });
}