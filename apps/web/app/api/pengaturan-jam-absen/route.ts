import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabase
    .from("pengaturan_jam_absen")
    .select("*")
    .order("berlaku_mulai", { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.scope || !body.jamMulaiMasuk || !body.jamBatasPulang || !body.berlakuMulai) {
    return NextResponse.json({ message: "Cakupan, jam mulai masuk, jam batas pulang, dan tanggal mulai wajib diisi" }, { status: 400 });
  }

  const { error } = await supabase.from("pengaturan_jam_absen").insert({
    scope: body.scope,
    jam_mulai_masuk: body.jamMulaiMasuk,
    jam_batas_pulang: body.jamBatasPulang,
    berlaku_mulai: body.berlakuMulai,
    berlaku_sampai: body.berlakuSampai || null,
  });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "aturan jam absen berhasil ditambahkan" });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ message: "id diperlukan" }, { status: 400 });

  const { error } = await supabase.from("pengaturan_jam_absen").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "aturan jam absen berhasil dihapus" });
}