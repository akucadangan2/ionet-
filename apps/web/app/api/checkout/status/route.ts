import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("id");

  if (!orderId) {
    return NextResponse.json({ message: "ID diperlukan" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("transaksi_voucher")
    .select("id, status, kode_voucher, paket_voucher(nama)")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ message: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    status: data.status,
    kodeVoucher: data.kode_voucher,
    paketNama: (data.paket_voucher as any)?.nama,
  });
}