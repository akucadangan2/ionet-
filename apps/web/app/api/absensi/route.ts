import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

// PENTING: server (Vercel) jalan pakai waktu UTC, BUKAN waktu lokal client.
// Client di Sulawesi = WITA (UTC+8), BUKAN WIB (UTC+7).
// Semua perhitungan tanggal/jam "sekarang" di file ini WAJIB pakai
// helper ini, jangan pakai new Date().toISOString() atau
// new Date().toTimeString() langsung - itu bakal salah jam.

function tanggalWita(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function jamWita(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Makassar",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

// Cari aturan jam absen yang berlaku buat karyawan ini hari ini.
// Prioritas: aturan khusus shift-nya (pagi/siang) > aturan "umum".
// Kalau nggak ketemu sama sekali, return null - artinya bebas, nggak dibatasi.
async function resolveJamAbsen(karyawanId: string) {
  const { data: karyawan } = await supabase
    .from("karyawan")
    .select("shift")
    .eq("id", karyawanId)
    .single();

  const shift = karyawan?.shift || null;
  const today = tanggalWita();
  const scopes = shift ? [shift, "umum"] : ["umum"];

  const { data: rules } = await supabase
    .from("pengaturan_jam_absen")
    .select("*")
    .in("scope", scopes)
    .lte("berlaku_mulai", today)
    .or(`berlaku_sampai.is.null,berlaku_sampai.gte.${today}`)
    .order("dibuat_at", { ascending: false });

  if (!rules || rules.length === 0) return null;

  const spesifik = rules.find((r) => r.scope === shift);
  return spesifik || rules[0];
}

export async function GET(req: NextRequest) {
  const tanggal = req.nextUrl.searchParams.get("tanggal") || tanggalWita();

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

  const today = tanggalWita();

  // Cek batas jam SEBELUM upload foto, biar gagal cepat kalau memang di luar jam yang diizinkan
  const rule = await resolveJamAbsen(karyawanId);
  if (rule) {
    const jamSekarang = jamWita(); // "HH:MM" dalam WITA, bukan UTC

    if (tipe === "masuk") {
      const batasMulai = String(rule.jam_mulai_masuk).slice(0, 5);
      if (jamSekarang < batasMulai) {
        return NextResponse.json({ message: `Absen masuk baru bisa mulai jam ${batasMulai}` }, { status: 400 });
      }
    } else {
      const batasPulang = String(rule.jam_batas_pulang).slice(0, 5);
      if (jamSekarang > batasPulang) {
        return NextResponse.json({ message: `Batas absen pulang sudah lewat (jam ${batasPulang})` }, { status: 400 });
      }
    }
  }

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