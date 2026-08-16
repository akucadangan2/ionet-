import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { addHotspotUser } from "@/lib/mikrotik/client";

function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const routerId = body.routerId;
    const paketVoucherId = body.paketVoucherId;
    const jumlah = Number(body.jumlah);

    if (!routerId || !paketVoucherId || !jumlah) {
      return NextResponse.json({ message: "Data belum lengkap" }, { status: 400 });
    }
    if (jumlah < 1 || jumlah > 100) {
      return NextResponse.json({ message: "Jumlah harus antara 1-100" }, { status: 400 });
    }

    const paketResult = await supabase
      .from("paket_voucher")
      .select("id, nama, harga, profile_mikrotik, limit_data_mb")
      .eq("id", paketVoucherId)
      .single();

    if (paketResult.error || !paketResult.data) {
      return NextResponse.json({ message: "Paket tidak ditemukan" }, { status: 404 });
    }
    const paket = paketResult.data;

    const routerResult = await supabase
      .from("router")
      .select("lokasi_id")
      .eq("id", routerId)
      .single();

    if (routerResult.error || !routerResult.data) {
      return NextResponse.json({ message: "Router tidak ditemukan" }, { status: 404 });
    }
    const routerLokasiId = routerResult.data.lokasi_id;

    const generated = [];
    const errors = [];

    for (let i = 0; i < jumlah; i++) {
      const kode = generateShortCode();
      try {
        const limitBytesTotal = paket.limit_data_mb ? paket.limit_data_mb * 1024 * 1024 : undefined;
        await addHotspotUser(routerId, kode, kode, paket.profile_mikrotik, undefined, limitBytesTotal);

        const insertResult = await supabase
          .from("transaksi_voucher")
          .insert({
            paket_voucher_id: paketVoucherId,
            lokasi_id: routerLokasiId,
            nominal_dibayar: paket.harga,
            metode: "tunai",
            status: "lunas",
            kode_voucher: kode + "/" + kode,
            dibayar_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insertResult.error) {
          errors.push({ kode: kode, error: insertResult.error.message });
        } else {
          generated.push({ kode: kode, paketNama: paket.nama, harga: paket.harga });
        }
      } catch (err) {
        errors.push({ kode: kode, error: (err as Error).message });
      }
    }

    return NextResponse.json({ generated: generated, errors: errors, total: jumlah });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}