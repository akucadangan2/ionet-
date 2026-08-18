import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const tipe = req.nextUrl.searchParams.get("tipe");
    const id = req.nextUrl.searchParams.get("id");

    if (!tipe || !id) {
      return NextResponse.json({ message: "tipe dan id diperlukan" }, { status: 400 });
    }

    if (tipe === "voucher") {
      const { data, error } = await supabase
        .from("transaksi_voucher")
        .select("id, kode_voucher, nominal_dibayar, metode, status, dibayar_at, no_hp_pembeli, paket_voucher(nama)")
        .eq("id", id)
        .single();

      if (error || !data) return NextResponse.json({ message: "Transaksi tidak ditemukan" }, { status: 404 });

      return NextResponse.json({
        invoiceNumber: "VC-" + data.id.slice(0, 8).toUpperCase(),
        tanggal: data.dibayar_at,
        namaPelanggan: data.no_hp_pembeli || "Pelanggan Umum",
        items: [{ nama: "Voucher " + ((data.paket_voucher as any)?.nama || ""), qty: 1, harga: Number(data.nominal_dibayar) }],
        total: Number(data.nominal_dibayar),
        metode: data.metode,
        status: data.status,
      });
    }

    if (tipe === "bulanan") {
      const { data, error } = await supabase
        .from("pembayaran_bulanan")
        .select("id, nominal, status, divalidasi_at, pelanggan(nama, alamat), paket_bulanan(nama)")
        .eq("id", id)
        .single();

      if (error || !data) return NextResponse.json({ message: "Transaksi tidak ditemukan" }, { status: 404 });

      return NextResponse.json({
        invoiceNumber: "LB-" + data.id.slice(0, 8).toUpperCase(),
        tanggal: data.divalidasi_at,
        namaPelanggan: (data.pelanggan as any)?.nama || "-",
        alamatPelanggan: (data.pelanggan as any)?.alamat || "",
        items: [{ nama: "Langganan Bulanan - " + ((data.paket_bulanan as any)?.nama || ""), qty: 1, harga: Number(data.nominal) }],
        total: Number(data.nominal),
        metode: "Transfer/QRIS",
        status: data.status,
      });
    }

    return NextResponse.json({ message: "Tipe tidak dikenali" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}