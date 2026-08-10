// app/api/tickets/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { ticketId, teknisiId } = await req.json();

  const { error } = await supabase
    .from("tiket_gangguan")
    .update({ assigned_to: teknisiId, status: "ditangani" })
    .eq("id", ticketId);

  if (error) {
    return NextResponse.json({ message: "gagal assign teknisi", error }, { status: 500 });
  }

  return NextResponse.json({ message: "teknisi berhasil di-assign" });
}