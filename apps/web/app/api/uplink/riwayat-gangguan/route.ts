import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("riwayat_gangguan_uplink")
      .select("id, waktu_mulai, waktu_selesai, durasi_menit, uplink(nama)")
      .order("waktu_mulai", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}