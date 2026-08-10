// app/api/tickets/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { ticketId } = await req.json();

  const { error } = await supabase
    .from("tiket_gangguan")
    .update({ status: "selesai", selesai_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (error) {
    return NextResponse.json({ message: "gagal update tiket", error }, { status: 500 });
  }

  return NextResponse.json({ message: "tiket ditandai selesai" });
}