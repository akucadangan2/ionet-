// app/api/paket/bulanan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { id, nama, harga_per_bulan, kecepatan } = await req.json();

  const payload = { nama, harga_per_bulan, kecepatan };

  const { error } = id
    ? await supabase.from("paket_bulanan").update(payload).eq("id", id)
    : await supabase.from("paket_bulanan").insert(payload);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "paket bulanan berhasil disimpan" });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabase.from("paket_bulanan").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "paket bulanan berhasil dihapus" });
}