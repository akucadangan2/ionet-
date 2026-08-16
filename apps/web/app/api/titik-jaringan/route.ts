import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabase
    .from("titik_jaringan")
    .select("*")
    .not("latitude", "is", null)
    .order("nama");

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const payload = {
    nama: body.nama,
    tipe: body.tipe,
    kapasitas_port: body.kapasitas_port || null,
    port_terpakai: body.port_terpakai || 0,
    latitude: body.latitude,
    longitude: body.longitude,
    keterangan: body.keterangan || null,
    lokasi_id: body.lokasi_id || null,
  };

  const { error } = body.id
    ? await supabase.from("titik_jaringan").update(payload).eq("id", body.id)
    : await supabase.from("titik_jaringan").insert(payload);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "berhasil disimpan" });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabase.from("titik_jaringan").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "berhasil dihapus" });
}