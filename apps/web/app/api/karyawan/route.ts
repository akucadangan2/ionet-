import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabase.from("karyawan").select("*").order("nama");
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const payload = {
    nama: body.nama,
    jabatan: body.jabatan,
    no_hp: body.no_hp || null,
    gaji_pokok: body.gaji_pokok || 0,
    status: body.status || "aktif",
  };

  const { error } = body.id
    ? await supabase.from("karyawan").update(payload).eq("id", body.id)
    : await supabase.from("karyawan").insert(payload);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "berhasil disimpan" });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabase.from("karyawan").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "berhasil dihapus" });
}