// app/api/export/laporan-keuangan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { exportToExcel } from "@/lib/excel-export";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dari = searchParams.get("dari"); // format YYYY-MM-DD
  const sampai = searchParams.get("sampai");

  const { data: voucherData } = await supabase
    .from("transaksi_voucher")
    .select("nomor_struk:struk(nomor_struk), created_at, dibayar_at, nominal_dibayar, metode, status, paket_voucher(nama)")
    .eq("status", "lunas")
    .gte("dibayar_at", dari ?? "1970-01-01")
    .lte("dibayar_at", sampai ?? "2099-12-31");

  const { data: bulananData } = await supabase
    .from("pembayaran_bulanan")
    .select("nomor_struk:struk(nomor_struk), divalidasi_at, nominal, metode, jumlah_bulan, pelanggan(nama)")
    .eq("status", "lunas")
    .gte("divalidasi_at", dari ?? "1970-01-01")
    .lte("divalidasi_at", sampai ?? "2099-12-31");

  const rows = [
    ...(voucherData ?? []).map((v: any) => ({
      "No Struk": v.nomor_struk?.[0]?.nomor_struk ?? "-",
      "Tanggal": v.dibayar_at ? new Date(v.dibayar_at).toLocaleString("id-ID") : "-",
      "Jenis": "Voucher",
      "Keterangan": v.paket_voucher?.nama ?? "-",
      "Metode": v.metode,
      "Nominal": v.nominal_dibayar,
    })),
    ...(bulananData ?? []).map((b: any) => ({
      "No Struk": b.nomor_struk?.[0]?.nomor_struk ?? "-",
      "Tanggal": b.divalidasi_at ? new Date(b.divalidasi_at).toLocaleString("id-ID") : "-",
      "Jenis": "Langganan Bulanan",
      "Keterangan": `${b.pelanggan?.nama ?? "-"} (${b.jumlah_bulan} bulan)`,
      "Metode": b.metode,
      "Nominal": b.nominal,
    })),
  ];

  rows.sort((a, b) => new Date(b.Tanggal).getTime() - new Date(a.Tanggal).getTime());

  const buffer = await exportToExcel(rows, "laporan-keuangan");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laporan-keuangan-${dari ?? "semua"}-${sampai ?? "semua"}.xlsx"`,
    },
  });
}