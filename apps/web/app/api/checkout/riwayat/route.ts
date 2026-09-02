import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const noHp = req.nextUrl.searchParams.get("noHp");

  if (!noHp) {
    return NextResponse.json({ message: "Nomor HP diperlukan" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("transaksi_voucher")
    .select("id, kode_voucher, dibayar_at, paket_voucher(nama)")
    .eq("no_hp_pembeli", noHp)
    .eq("status", "lunas")
    .order("dibayar_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ message: "Gagal mengambil data: " + error.message }, { status: 500 });
  }

  return NextResponse.json({
    riwayat: (data || []).map(function (d) {
      return {
        kodeVoucher: d.kode_voucher,
        paketNama: (d.paket_voucher as any)?.nama,
        dibayarAt: d.dibayar_at,
      };
    }),
  });
}