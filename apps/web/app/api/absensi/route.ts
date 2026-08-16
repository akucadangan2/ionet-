import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const tanggal = req.nextUrl.searchParams.get("tanggal") || new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("absensi")
    .select("*, karyawan(nama, jabatan)")
    .eq("tanggal", tanggal)
    .order("jam_masuk");

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { karyawanId, tipe, latitude, longitude, fotoBase64 } = body;

  const today = new Date().toISOString().slice(0, 10);

  let fotoUrl = null;
  if (fotoBase64) {
    const fileName = `${karyawanId}_${tipe}_${Date.now()}.jpg`;
    const base64Data = fotoBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const { error: uploadError } = await supabase.storage
      .from("foto-absensi")
      .upload(fileName, buffer, { contentType: "image/jpeg" });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("foto-absensi").getPublicUrl(fileName);
      fotoUrl = urlData.publicUrl;
    }
  }

  const { data: existing } = await supabase
    .from("absensi")
    .select("id")
    .eq("karyawan_id", karyawanId)
    .eq("tanggal", today)
    .maybeSingle();

  if (tipe === "masuk") {
    if (existing) {
      return NextResponse.json({ message: "Sudah absen masuk hari ini" }, { status: 400 });
    }
    const { error } = await supabase.from("absensi").insert({
      karyawan_id: karyawanId,
      tanggal: today,
      jam_masuk: new Date().toISOString(),
      latitude_masuk: latitude,
      longitude_masuk: longitude,
      foto_masuk_url: fotoUrl,
      status: "hadir",
    });
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  } else {
    if (!existing) {
      return NextResponse.json({ message: "Belum absen masuk hari ini" }, { status: 400 });
    }
    const { error } = await supabase
      .from("absensi")
      .update({
        jam_pulang: new Date().toISOString(),
        latitude_pulang: latitude,
        longitude_pulang: longitude,
        foto_pulang_url: fotoUrl,
      })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "berhasil absen" });
}