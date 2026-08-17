import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabase.from("jalur_kabel").select("*");
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { error } = await supabase.from("jalur_kabel").insert({
    nama: body.nama,
    warna: body.warna,
    koordinat: body.koordinat,
    keterangan: body.keterangan || null,
  });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "berhasil disimpan" });
}