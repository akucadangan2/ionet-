import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

const namaBulan = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function hitungHariKerja(tahun: number, bulan: number, hariLiburSet: Set<string>) {
  const jumlahHariDalamBulan = new Date(tahun, bulan, 0).getDate();
  let count = 0;
  for (let d = 1; d <= jumlahHariDalamBulan; d++) {
    const tanggal = new Date(tahun, bulan - 1, d);
    const tanggalStr = tahun + "-" + String(bulan).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    if (tanggal.getDay() === 0) continue; // Minggu libur
    if (hariLiburSet.has(tanggalStr)) continue; // tanggal merah
    count++;
  }
  return count;
}

export async function GET(req: NextRequest) {
  try {
    const karyawanId = req.nextUrl.searchParams.get("karyawanId");
    const tahun = req.nextUrl.searchParams.get("tahun");

    let query = supabase
      .from("payroll")
      .select("*, karyawan(nama, jabatan)")
      .eq("status", "dibayar")
      .order("tahun", { ascending: false })
      .order("bulan", { ascending: false });

    if (karyawanId) query = query.eq("karyawan_id", karyawanId);
    if (tahun) query = query.eq("tahun", Number(tahun));

    const { data: payrollList, error } = await query;
    if (error) throw new Error(error.message);

    const results = [];

    for (const p of payrollList || []) {
      const tanggalAwal = p.tahun + "-" + String(p.bulan).padStart(2, "0") + "-01";
      const tanggalAkhir = new Date(p.tahun, p.bulan, 0).toISOString().slice(0, 10);

      const [absensiResult, liburResult] = await Promise.all([
        supabase.from("absensi").select("status").eq("karyawan_id", p.karyawan_id).gte("tanggal", tanggalAwal).lte("tanggal", tanggalAkhir),
        supabase.from("hari_libur").select("tanggal").gte("tanggal", tanggalAwal).lte("tanggal", tanggalAkhir),
      ]);

      const semuaAbsensi = absensiResult.data || [];
      const jumlahHadir = semuaAbsensi.filter((a) => a.status === "hadir").length;
      const jumlahAlpa = semuaAbsensi.filter((a) => a.status === "alpa").length;
      const jumlahIzin = semuaAbsensi.filter((a) => a.status === "izin").length;
      const jumlahCuti = semuaAbsensi.filter((a) => a.status === "cuti").length;
      const jumlahSakit = semuaAbsensi.filter((a) => a.status === "sakit").length;

      const hariLiburSet: Set<string> = new Set((liburResult.data || []).map((h: any) => h.tanggal as string));
      const hariKerja = hitungHariKerja(p.tahun, p.bulan, hariLiburSet);
      const gajiPerHari = hariKerja > 0 ? Math.round(Number(p.gaji_pokok) / hariKerja) : 0;

      results.push({
        id: p.id,
        bulan: p.bulan,
        tahun: p.tahun,
        namaBulan: namaBulan[p.bulan],
        namaKaryawan: (p.karyawan as any)?.nama || "-",
        jabatan: (p.karyawan as any)?.jabatan || "-",
        gajiPokok: Number(p.gaji_pokok),
        hariKerja,
        gajiPerHari,
        jumlahHadir,
        jumlahAlpa,
        jumlahIzin,
        jumlahCuti,
        jumlahSakit,
        potonganAlpa: Number(p.potongan_alpa),
        potonganBpjs: Number(p.potongan_bpjs || 0),
        potonganKasbon: Number(p.potongan_kasbon),
        totalGaji: Number(p.total_gaji),
        dibuatAt: p.dibuat_at,
      });
    }

    return NextResponse.json({ data: results });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}