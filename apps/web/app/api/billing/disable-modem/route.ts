// app/api/billing/disable-modem/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { setPPPoEStatus } from "@/lib/mikrotik/client";
import { getRouterConfigByLokasi } from "@/lib/mikrotik/get-router-config";

export async function POST(req: NextRequest) {
  try {
    const { pelangganId } = await req.json();
    if (!pelangganId) {
      return NextResponse.json({ message: "pelangganId diperlukan" }, { status: 400 });
    }

    const { data: pelanggan, error } = await supabase
      .from("pelanggan")
      .select("*")
      .eq("id", pelangganId)
      .single();

    if (error || !pelanggan) {
      return NextResponse.json({ message: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    if (!pelanggan.pppoe_username) {
      return NextResponse.json({ message: "Pelanggan ini tidak punya username PPPoE" }, { status: 400 });
    }

    const routerConfig = await getRouterConfigByLokasi(pelanggan.lokasi_id);
    await setPPPoEStatus(routerConfig, pelanggan.pppoe_username, false);

    await supabase
      .from("pelanggan")
      .update({ status: "suspend" })
      .eq("id", pelangganId);

    return NextResponse.json({ message: "Modem berhasil dimatikan" });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}