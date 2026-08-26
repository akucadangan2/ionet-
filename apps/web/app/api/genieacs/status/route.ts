import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabase.from("genieacs_status_pelanggan").select("*");
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { error } = await supabase
    .from("genieacs_status_pelanggan")
    .upsert(
      { pppoe_username: body.pppoeUsername, status: body.status, catatan: body.catatan || null, updated_at: new Date().toISOString() },
      { onConflict: "pppoe_username" }
    );
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "berhasil disimpan" });
}