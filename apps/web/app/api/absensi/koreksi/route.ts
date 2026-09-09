// app/api/absensi/koreksi/route.ts
// Dipakai Super Admin buat ubah status absensi manual (alpa -> izin/cuti/hadir,
// atau sebaliknya), termasuk kasus lupa absen pulang yang dikonfirmasi via WA.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { karyawanId, tanggal, status, jamMasuk, jamPulang } = await req.json();

    if (!karyawanId || !tanggal || !status) {
      return NextResponse.json({ message: "karyawanId, tanggal, dan status diperlukan" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("absensi")
      .select("id")
      .eq("karyawan_id", karyawanId)
      .eq("tanggal", tanggal)
      .maybeSingle();

    const payload: any = { status };
    if (jamMasuk !== undefined) payload.jam_masuk = jamMasuk;
    if (jamPulang !== undefined) payload.jam_pulang = jamPulang;

    if (existing) {
      const { error } = await supabase.from("absensi").update(payload).eq("id", existing.id);
      if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    } else {
      const { error } = await supabase.from("absensi").insert({
        karyawan_id: karyawanId,
        tanggal,
        ...payload,
      });
      if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "status absensi berhasil diperbarui" });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}