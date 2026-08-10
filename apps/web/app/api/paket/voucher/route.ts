// app/api/paket/voucher/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { id, nama, harga, durasi_menit, profile_mikrotik } = await req.json();

  const payload = { nama, harga, durasi_menit, profile_mikrotik };

  const { error } = id
    ? await supabase.from("paket_voucher").update(payload).eq("id", id)
    : await supabase.from("paket_voucher").insert(payload);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "paket voucher berhasil disimpan" });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabase.from("paket_voucher").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "paket voucher berhasil dihapus" });
}