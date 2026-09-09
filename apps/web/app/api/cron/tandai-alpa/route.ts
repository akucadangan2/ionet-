// app/api/cron/tandai-alpa/route.ts
// Dipanggil terjadwal tiap hari dini hari (misal jam 01:00) lewat cron-job.org,
// buat finalize status absensi HARI SEBELUMNYA (biar hari yang baru lewat
// tengah malam udah pasti selesai, nggak keburu ditandain alpa padahal
// masih siang/sore).
//
// Aturan:
// - Kalau hari kemarin itu Minggu -> skip, libur, nggak diapa-apain
// - Kalau hari kemarin ada di tabel hari_libur -> skip, libur nasional
// - Karyawan yang nggak punya baris absensi sama sekali -> ditandain "alpa"
// - Karyawan yang absen masuk tapi nggak absen pulang -> ditandain "alpa"
//   (sesuai aturan: default alpa kecuali dikonfirmasi manual jadi hadir)
// - Karyawan yang statusnya udah "izin" atau "cuti" (diset manual duluan)
//   TIDAK disentuh - itu keputusan Super Admin, bukan mau ditimpa cron
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET() {
  const kemarin = new Date();
  kemarin.setDate(kemarin.getDate() - 1);
  const tanggalTarget = kemarin.toISOString().slice(0, 10);

  const hariDalamMinggu = kemarin.getDay(); // 0 = Minggu
  if (hariDalamMinggu === 0) {
    return NextResponse.json({ message: `${tanggalTarget} adalah hari Minggu, dilewati` });
  }

  const { data: liburData } = await supabase
    .from("hari_libur")
    .select("id")
    .eq("tanggal", tanggalTarget)
    .maybeSingle();

  if (liburData) {
    return NextResponse.json({ message: `${tanggalTarget} adalah hari libur nasional, dilewati` });
  }

  const { data: karyawanList } = await supabase
    .from("karyawan")
    .select("id")
    .eq("status", "aktif");

  const { data: absensiHariItu } = await supabase
    .from("absensi")
    .select("id, karyawan_id, jam_masuk, jam_pulang, status")
    .eq("tanggal", tanggalTarget);

  const absensiByKaryawan: Record<string, any> = {};
  (absensiHariItu || []).forEach((a) => {
    absensiByKaryawan[a.karyawan_id] = a;
  });

  const results: Record<string, string>[] = [];

  for (const k of karyawanList || []) {
    const existing = absensiByKaryawan[k.id];

    if (!existing) {
      // Nggak ada absen sama sekali hari itu -> alpa
      const { error } = await supabase.from("absensi").insert({
        karyawan_id: k.id,
        tanggal: tanggalTarget,
        status: "alpa",
      });
      results.push({ karyawanId: k.id, message: error ? `error: ${error.message}` : "ditandai alpa (tidak absen)" });
      continue;
    }

    if (existing.status === "izin" || existing.status === "cuti") {
      // Sudah diset manual, jangan disentuh
      results.push({ karyawanId: k.id, message: `dibiarkan (status: ${existing.status})` });
      continue;
    }

    if (existing.jam_masuk && !existing.jam_pulang) {
      // Absen masuk tapi lupa pulang -> default alpa
      const { error } = await supabase
        .from("absensi")
        .update({ status: "alpa" })
        .eq("id", existing.id);
      results.push({ karyawanId: k.id, message: error ? `error: ${error.message}` : "ditandai alpa (lupa absen pulang)" });
      continue;
    }

    results.push({ karyawanId: k.id, message: `dibiarkan (status: ${existing.status})` });
  }

  return NextResponse.json({ tanggal: tanggalTarget, diproses: (karyawanList || []).length, results });
}