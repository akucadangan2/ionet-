// app/api/pengaturan/notifikasi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { id, label, no_hp, kategori, aktif } = await req.json();
  const payload = { label, no_hp, kategori, aktif: aktif ?? true };

  const { error } = id
    ? await supabase.from("notification_contacts").update(payload).eq("id", id)
    : await supabase.from("notification_contacts").insert(payload);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "kontak berhasil disimpan" });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabase.from("notification_contacts").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "kontak berhasil dihapus" });
}