import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { createCheckout } from "@/lib/doku/client";

export async function POST(req: NextRequest) {
  try {
    const { paketVoucherId, noHpPembeli } = await req.json();

    if (!paketVoucherId || !noHpPembeli) {
      return NextResponse.json({ message: "Data belum lengkap" }, { status: 400 });
    }

    const { data: lokasiDefault } = await supabase.from("lokasi").select("id").limit(1).single();
    if (!lokasiDefault) {
      return NextResponse.json({ message: "Lokasi belum tersedia" }, { status: 500 });
    }
    const lokasiId = lokasiDefault.id;

    const { data: paket, error: paketError } = await supabase
      .from("paket_voucher")
      .select("id, nama, harga")
      .eq("id", paketVoucherId)
      .single();

    if (paketError || !paket) {
      return NextResponse.json({ message: "Paket tidak ditemukan" }, { status: 404 });
    }

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
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}