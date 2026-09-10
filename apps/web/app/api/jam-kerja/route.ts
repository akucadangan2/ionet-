import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabase.from("jam_kerja").select("*").order("shift");
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { error } = await supabase
    .from("jam_kerja")
    .update({ jam_masuk: body.jamMasuk, jam_pulang: body.jamPulang })
    .eq("shift", body.shift);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "jam kerja berhasil disimpan" });
}