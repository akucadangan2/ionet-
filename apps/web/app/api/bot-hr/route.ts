import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const action = body.action;

  if (action === "absensi_hari_ini") {
    const today = new Date().toISOString().slice(0, 10);
    const { data: semuaKaryawan } = await supabase.from("karyawan").select("id, nama").eq("status", "aktif");
    const { data: absenHariIni } = await supabase.from("absensi").select("karyawan_id").eq("tanggal", today);

    const sudahIds = (absenHariIni || []).map((a) => a.karyawan_id);
    const sudah = (semuaKaryawan || []).filter((k) => sudahIds.includes(k.id)).map((k) => k.nama);
    const belum = (semuaKaryawan || []).filter((k) => !sudahIds.includes(k.id)).map((k) => k.nama);

    let reply = "Sudah absen (" + sudah.length + "):\n";
    reply += sudah.length > 0 ? sudah.map((n) => "- " + n).join("\n") : "Belum ada";
    reply += "\n\nBelum absen (" + belum.length + "):\n";
    reply += belum.length > 0 ? belum.map((n) => "- " + n).join("\n") : "Semua sudah absen";

    return NextResponse.json({ reply });
  }

  if (action === "kasbon_pending") {
    const { data } = await supabase
      .from("kasbon")
      .select("jumlah, sisa_saldo, status, karyawan(nama)")
      .in("status", ["pending", "disetujui"]);

    if (!data || data.length === 0) {
      return NextResponse.json({ reply: "Tidak ada kasbon pending saat ini." });
    }

    let total = 0;
    let reply = "Kasbon pending/aktif (" + data.length + "):\n\n";
    data.forEach(function (k: any) {
      const nominal = k.status === "pending" ? k.jumlah : k.sisa_saldo;
      total += Number(nominal);
      reply += "- " + (k.karyawan?.nama || "-") + ": " + formatRupiah(nominal) + " (" + k.status + ")\n";
    });
    reply += "\nTotal: " + formatRupiah(total);

    return NextResponse.json({ reply });
  }

  if (action === "komisi_pending") {
    const { data } = await supabase
      .from("komisi")
      .select("jumlah_komisi, jenis, karyawan(nama)")
      .eq("status", "pending");

    if (!data || data.length === 0) {
      return NextResponse.json({ reply: "Tidak ada komisi pending saat ini." });
    }

    let total = 0;
    let reply = "Komisi belum dibayar (" + data.length + "):\n\n";
    data.forEach(function (k: any) {
      total += Number(k.jumlah_komisi);
      reply += "- " + (k.karyawan?.nama || "-") + " (" + k.jenis + "): " + formatRupiah(k.jumlah_komisi) + "\n";
    });
    reply += "\nTotal: " + formatRupiah(total);

    return NextResponse.json({ reply });
  }

  if (action === "payroll_bulan_ini") {
    const now = new Date();
    const { data } = await supabase
      .from("payroll")
      .select("*, karyawan(nama)")
      .eq("bulan", now.getMonth() + 1)
      .eq("tahun", now.getFullYear());

    if (!data || data.length === 0) {
      return NextResponse.json({ reply: "Payroll bulan ini belum digenerate. Buka halaman Payroll untuk generate." });
    }

    let total = 0;
    let reply = "Payroll bulan ini (" + data.length + " karyawan):\n\n";
    data.forEach(function (p: any) {
      total += Number(p.total_gaji);
      reply += "- " + (p.karyawan?.nama || "-") + ": " + formatRupiah(p.total_gaji) + " (" + p.status + ")\n";
    });
    reply += "\nTotal payroll: " + formatRupiah(total);

    return NextResponse.json({ reply });
  }

  return NextResponse.json({ reply: "Perintah tidak dikenali." });
}