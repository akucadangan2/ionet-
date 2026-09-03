import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { generateDynamicQris } from "@/lib/doku/client";
import QRCode from "qrcode";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { paketVoucherId, noHpPembeli } = await req.json();

    if (!paketVoucherId || !noHpPembeli) {
      return NextResponse.json({ message: "Data belum lengkap" }, { status: 400 });
    }

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
    const paket = paketResult.data;

    const { data: transaksi, error: insertError } = await supabase
      .from("transaksi_voucher")
      .insert({
        paket_voucher_id: paketVoucherId,
        lokasi_id: lokasiResult.data.id,
        no_hp_pembeli: noHpPembeli,
        nominal_dibayar: paket.harga,
        metode: "qris_doku_snap",
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !transaksi) {
      return NextResponse.json({ message: "Gagal membuat transaksi: " + insertError?.message }, { status: 500 });
    }

    const qris = await generateDynamicQris(transaksi.id, paket.harga);

    await supabase
      .from("transaksi_voucher")
      .update({ doku_reference_no: qris.referenceNo })
      .eq("id", transaksi.id);

    const qrImage = await QRCode.toDataURL(qris.qrString, { width: 280, margin: 1 });

    return NextResponse.json({
      orderId: transaksi.id,
      qrImage,
      expiredAt: qris.expiredAt,
    });
  } catch (err: any) {
    console.error("Error voucher-qris:", err?.message || err, err?.debugSteps ? JSON.stringify(err.debugSteps) : "");
    return NextResponse.json({ message: err?.message || "Gagal generate QRIS" }, { status: 500 });
  }
}