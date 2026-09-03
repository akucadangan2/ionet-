import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { queryQris } from "@/lib/doku/client";
import { processPaymentSuccess } from "@/lib/payment/process-payment";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("id");

  if (!orderId) {
    return NextResponse.json({ message: "ID diperlukan" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("transaksi_voucher")
    .select("id, status, kode_voucher, doku_reference_no, paket_voucher(nama)")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ message: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  if (data.status === "pending" && data.doku_reference_no) {
    try {
      const result = await queryQris(orderId, data.doku_reference_no);
      if (result.status === "00") {
        await processPaymentSuccess(orderId);
        const refreshed = await supabase
          .from("transaksi_voucher")
          .select("status, kode_voucher, paket_voucher(nama)")
          .eq("id", orderId)
          .maybeSingle();
        return NextResponse.json({
          status: refreshed.data?.status,
          kodeVoucher: refreshed.data?.kode_voucher,
          paketNama: (refreshed.data?.paket_voucher as any)?.nama,
        });
      }
    } catch (e) {
      console.error("Gagal query status DOKU:", e);
    }
  }

  return NextResponse.json({
    status: data.status,
    kodeVoucher: data.kode_voucher,
    paketNama: (data.paket_voucher as any)?.nama,
  });
}