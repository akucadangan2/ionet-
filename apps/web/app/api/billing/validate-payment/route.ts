// app/api/billing/validate-payment/route.ts
// Admin klik "Validasi" - baru di sini pembayaran bulanan resmi dihitung lunas
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { createStrukBulanan } from "@/lib/struk/generate-struk";

export async function POST(req: NextRequest) {
  const { paymentId, adminId } = await req.json();

  const { data: payment, error } = await supabase
    .from("pembayaran_bulanan")
    .select("*, pelanggan(*)")
    .eq("id", paymentId)
    .single();

  if (error || !payment) {
    return NextResponse.json({ message: "pembayaran tidak ditemukan" }, { status: 404 });
  }

  if (payment.status === "lunas") {
    return NextResponse.json({ message: "sudah divalidasi sebelumnya" });
  }

  // Hitung periode berdasarkan jumlah_bulan yang dibayar
  const today = new Date();
  const mulai = payment.pelanggan?.tanggal_jatuh_tempo
    ? new Date(payment.pelanggan.tanggal_jatuh_tempo)
    : today;
  const selesai = new Date(mulai);
  selesai.setMonth(selesai.getMonth() + payment.jumlah_bulan);

  const { error: updateError } = await supabase
    .from("pembayaran_bulanan")
    .update({
      status: "lunas",
      divalidasi_oleh: adminId,
      divalidasi_at: new Date().toISOString(),
      periode_mulai: mulai.toISOString().split("T")[0],
      periode_selesai: selesai.toISOString().split("T")[0],
    })
    .eq("id", paymentId);

  if (updateError) {
    return NextResponse.json({ message: `gagal update pembayaran: ${updateError.message}` }, { status: 500 });
  }

  // Update jatuh tempo pelanggan sesuai periode baru
  const { error: pelangganError } = await supabase
    .from("pelanggan")
    .update({ tanggal_jatuh_tempo: selesai.toISOString().split("T")[0] })
    .eq("id", payment.pelanggan.id);

  if (pelangganError) {
    return NextResponse.json({ message: `gagal update pelanggan: ${pelangganError.message}` }, { status: 500 });
  }

  const struk = await createStrukBulanan(paymentId);

  return NextResponse.json({
    message: "pembayaran divalidasi, menunggu aktivasi modem manual",
    strukId: struk.id,
  });
}