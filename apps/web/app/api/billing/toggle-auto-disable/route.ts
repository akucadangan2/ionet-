// app/api/billing/toggle-auto-disable/route.ts
// Dipakai dari dashboard buat setting per-pelanggan: exception dari auto-disable,
// atau bisa juga dipanggil massal buat "terapkan ke semua pelanggan sekaligus"
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { pelangganIds, disableOtomatis } = await req.json();
  // pelangganIds: string[] - bisa 1 pelanggan, bisa semua ID sekaligus dari dashboard

  const { error } = await supabase
    .from("pelanggan")
    .update({ disable_otomatis: disableOtomatis })
    .in("id", pelangganIds);

  if (error) {
    return NextResponse.json({ message: "gagal update", error }, { status: 500 });
  }

  return NextResponse.json({ message: `disable_otomatis diupdate untuk ${pelangganIds.length} pelanggan` });
}