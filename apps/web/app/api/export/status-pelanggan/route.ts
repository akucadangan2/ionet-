// app/api/export/status-pelanggan/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { exportToExcel } from "@/lib/excel-export";

export async function GET() {
  const { data: pelanggan } = await supabase
    .from("pelanggan")
    .select("nama, no_hp, alamat, tipe_langganan, status, tanggal_jatuh_tempo, paket_bulanan(nama)")
    .order("nama");

  const today = new Date().toISOString().split("T")[0];

  const rows = (pelanggan ?? []).map((p: any) => ({
    "Nama": p.nama,
    "No HP": p.no_hp ?? "-",
    "Alamat": p.alamat ?? "-",
    "Paket": p.paket_bulanan?.nama ?? "-",
    "Jatuh Tempo": p.tanggal_jatuh_tempo ?? "-",
    "Status Bayar":
      p.tipe_langganan === "pppoe_bulanan"
        ? (p.tanggal_jatuh_tempo && p.tanggal_jatuh_tempo >= today ? "Lunas" : "Belum Lunas")
        : "-",
    "Status Modem": p.status,
  }));

  const buffer = await exportToExcel(rows, "status-pelanggan");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="daftar-pelanggan-${today}.xlsx"`,
    },
  });
}