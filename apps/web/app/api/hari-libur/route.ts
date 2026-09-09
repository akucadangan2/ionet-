import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabase
    .from("hari_libur")
    .select("*")
    .order("tanggal");

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { error } = await supabase.from("hari_libur").insert({
    tanggal: body.tanggal,
    keterangan: body.keterangan || null,
  });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "hari libur berhasil ditambahkan" });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ message: "id diperlukan" }, { status: 400 });

  const { error } = await supabase.from("hari_libur").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "hari libur berhasil dihapus" });
}