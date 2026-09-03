import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { createCheckout } from "@/lib/doku/client";
export const maxDuration = 30;
export async function POST(req: NextRequest) {
  try {
    const { paketVoucherId, noHpPembeli } = await req.json();

    if (!paketVoucherId || !noHpPembeli) {
      return NextResponse.json({ message: "Data belum lengkap" }, { status: 400 });
    }

    // 2 query ini independen satu sama lain, jalanin bareng
    const [lokasiResult, paketResult] = await Promise.all([
      supabase.from("lokasi").select("id").limit(1).single(),
      supabase.from("paket_voucher").select("id, nama, harga").eq("id", paketVoucherId).single(),
    ]);

    if (!lokasiResult.data) {
      return NextResponse.json({ message: "Lokasi belum tersedia" }, { status: 500 });
    }
    if (paketResult.error || !paketResult.data) {
      return NextResponse.json({ message: "Paket tidak ditemukan" }, { status: 404 });
    }
    const lokasiId = lokasiResult.data.id;
    const paket = paketResult.data;

    const { data: transaksi, error: insertError } = await supabase
      .from("transaksi_voucher")
      .insert({
        paket_voucher_id: paketVoucherId,
        lokasi_id: lokasiId,
        no_hp_pembeli: noHpPembeli,
        nominal_dibayar: paket.harga,
        metode: "qris_doku",
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !transaksi) {
      return NextResponse.json({ message: "Gagal membuat transaksi: " + insertError?.message }, { status: 500 });
    }

    const checkoutResult = await createCheckout({
      orderId: transaksi.id,
      amount: paket.harga,
      itemName: paket.nama,
      customerName: "Pelanggan",
      customerEmail: "",
      customerPhone: noHpPembeli,
    });

    return NextResponse.json({ paymentUrl: checkoutResult.paymentUrl });
  } catch (err) {
    console.error("Error checkout voucher:", err);
    return NextResponse.json({ message: (err as Error).message || "Gagal memproses pembayaran" }, { status: 500 });
  }
}