// app/api/billing/generate-voucher-manual/route.ts
// Buat penjualan tunai langsung (bukan lewat DOKU) - generate + lunas sekaligus
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { addHotspotUser } from "@/lib/mikrotik/client";
import { getRouterConfigByLokasi } from "@/lib/mikrotik/get-router-config";
import { createStrukVoucher } from "@/lib/struk/generate-struk";

export async function POST(req: NextRequest) {
  const { paketVoucherId, lokasiId, noHpPembeli } = await req.json();

  const { data: paket, error: paketError } = await supabase
    .from("paket_voucher")
    .select("*")
    .eq("id", paketVoucherId)
    .single();

  if (paketError || !paket) {
    return NextResponse.json({ message: "paket voucher tidak ditemukan" }, { status: 404 });
  }

  const username = `V${Date.now().toString().slice(-8)}`;
  const password = Math.random().toString(36).slice(-6);

  try {
    const routerConfig = await getRouterConfigByLokasi(lokasiId);
    await addHotspotUser(routerConfig, username, password, paket.profile_mikrotik);
  } catch (err) {
    return NextResponse.json(
      { message: `gagal generate voucher ke Mikrotik: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  const { data: transaksi, error: txError } = await supabase
    .from("transaksi_voucher")
    .insert({
      lokasi_id: lokasiId,
      paket_voucher_id: paketVoucherId,
      no_hp_pembeli: noHpPembeli || null,
      nominal_dibayar: paket.harga,
      metode: "tunai",
      status: "lunas",
      kode_voucher: `${username}/${password}`,
      dibayar_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (txError) {
    return NextResponse.json({ message: `gagal simpan transaksi: ${txError.message}` }, { status: 500 });
  }

  const struk = await createStrukVoucher(transaksi.id);

  return NextResponse.json({
    username,
    password,
    strukId: struk.id,
    message: "voucher berhasil dibuat",
  });
}