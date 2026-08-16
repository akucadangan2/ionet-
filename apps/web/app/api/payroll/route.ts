import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const bulan = req.nextUrl.searchParams.get("bulan");
  const tahun = req.nextUrl.searchParams.get("tahun");

  const { data, error } = await supabase
    .from("payroll")
    .select("*, karyawan(nama, jabatan)")
    .eq("bulan", bulan)
    .eq("tahun", tahun)
    .order("dibuat_at");

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bulan = Number(body.bulan);
    const tahun = Number(body.tahun);
    const potonganPerAlpa = Number(body.potonganPerAlpa) || 0;

    const { data: karyawanList } = await supabase
      .from("karyawan")
      .select("id, nama, gaji_pokok")
      .eq("status", "aktif");

    const tanggalAwal = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
    const tanggalAkhir = new Date(tahun, bulan, 0).toISOString().slice(0, 10);

    const results = [];

    for (const k of karyawanList || []) {
      const absensiResult = await supabase
        .from("absensi")
        .select("status")
        .eq("karyawan_id", k.id)
        .gte("tanggal", tanggalAwal)
        .lte("tanggal", tanggalAkhir);

      const jumlahHadir = (absensiResult.data || []).filter((a) => a.status === "hadir").length;
      const jumlahAlpa = (absensiResult.data || []).filter((a) => a.status === "alpa").length;
      const potonganAlpa = jumlahAlpa * potonganPerAlpa;

      const kasbonResult = await supabase
        .from("kasbon")
        .select("cicilan_per_bulan, sisa_saldo")
        .eq("karyawan_id", k.id)
        .eq("status", "disetujui")
        .gt("sisa_saldo", 0);

      let potonganKasbon = 0;
      for (const kb of kasbonResult.data || []) {
        const cicilan = Math.min(Number(kb.cicilan_per_bulan) || 0, Number(kb.sisa_saldo) || 0);
        potonganKasbon += cicilan;
      }

      const totalGaji = Number(k.gaji_pokok) - potonganAlpa - potonganKasbon;

      const payload = {
        karyawan_id: k.id,
        bulan,
        tahun,
        gaji_pokok: k.gaji_pokok,
        jumlah_hadir: jumlahHadir,
        jumlah_alpa: jumlahAlpa,
        potongan_alpa: potonganAlpa,
        potongan_kasbon: potonganKasbon,
        total_gaji: totalGaji,
        status: "draft",
      };

      const { error } = await supabase
        .from("payroll")
        .upsert(payload, { onConflict: "karyawan_id,bulan,tahun" });

      if (!error) results.push({ nama: k.nama, totalGaji });
    }

    return NextResponse.json({ message: results.length + " payroll berhasil digenerate", results });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabase.from("payroll").update({ status: "dibayar" }).eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "berhasil ditandai dibayar" });
}