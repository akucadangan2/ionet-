import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

interface KasEntry {
  tanggal: string;
  keterangan: string;
  kategori: string;
  tipe: "masuk" | "keluar";
  nominal: number;
}

export async function GET(req: NextRequest) {
  try {
    const dari = req.nextUrl.searchParams.get("dari");
    const sampai = req.nextUrl.searchParams.get("sampai");

    let voucherQuery = supabase
      .from("transaksi_voucher")
      .select("dibayar_at, nominal_dibayar, metode, paket_voucher(nama)")
      .eq("status", "lunas");
    if (dari) voucherQuery = voucherQuery.gte("dibayar_at", dari);
    if (sampai) voucherQuery = voucherQuery.lte("dibayar_at", sampai + "T23:59:59");
    const voucherResult = await voucherQuery;

    let bulananQuery = supabase
      .from("pembayaran_bulanan")
      .select("divalidasi_at, nominal, pelanggan(nama)")
      .eq("status", "lunas");
    if (dari) bulananQuery = bulananQuery.gte("divalidasi_at", dari);
    if (sampai) bulananQuery = bulananQuery.lte("divalidasi_at", sampai + "T23:59:59");
    const bulananResult = await bulananQuery;

    let manualQuery = supabase.from("buku_kas_manual").select("*").order("tanggal");
    if (dari) manualQuery = manualQuery.gte("tanggal", dari);
    if (sampai) manualQuery = manualQuery.lte("tanggal", sampai);
    const manualResult = await manualQuery;

    const entries: KasEntry[] = [];

    (voucherResult.data || []).forEach((v: any) => {
      entries.push({
        tanggal: v.dibayar_at,
        keterangan: "Voucher " + (v.paket_voucher?.nama || "") + " (" + v.metode + ")",
        kategori: "Voucher",
        tipe: "masuk",
        nominal: Number(v.nominal_dibayar),
      });
    });

    (bulananResult.data || []).forEach((b: any) => {
      entries.push({
        tanggal: b.divalidasi_at,
        keterangan: "Langganan Bulanan - " + (b.pelanggan?.nama || ""),
        kategori: "Langganan Bulanan",
        tipe: "masuk",
        nominal: Number(b.nominal),
      });
    });

    (manualResult.data || []).forEach((m: any) => {
      entries.push({
        tanggal: m.tanggal,
        keterangan: m.keterangan,
        kategori: m.kategori || "Lainnya",
        tipe: m.tipe,
        nominal: Number(m.nominal),
      });
    });

    entries.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    let saldo = 0;
    const withSaldo = entries.map((e) => {
      saldo += e.tipe === "masuk" ? e.nominal : -e.nominal;
      return { ...e, saldo };
    });

    const totalMasuk = entries.filter((e) => e.tipe === "masuk").reduce((sum, e) => sum + e.nominal, 0);
    const totalKeluar = entries.filter((e) => e.tipe === "keluar").reduce((sum, e) => sum + e.nominal, 0);

    return NextResponse.json({ entries: withSaldo, totalMasuk, totalKeluar, saldoAkhir: saldo });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { error } = await supabase.from("buku_kas_manual").insert({
      tanggal: body.tanggal,
      keterangan: body.keterangan,
      kategori: body.kategori || null,
      tipe: body.tipe,
      nominal: body.nominal,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ message: "berhasil disimpan" });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}