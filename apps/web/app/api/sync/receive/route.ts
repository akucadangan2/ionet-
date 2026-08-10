// app/api/sync/receive/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

const LOCAL_AGENT_TOKEN = process.env.LOCAL_AGENT_TOKEN;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${LOCAL_AGENT_TOKEN}`) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const { table, recordId, payload } = await req.json();

  if (table === "transaksi_voucher") {
    const { error } = await supabase.from("transaksi_voucher").upsert({
      id: recordId,
      paket_voucher_id: payload.paketVoucherId,
      no_hp_pembeli: payload.noHpPembeli,
      nominal_dibayar: payload.nominalDibayar,
      metode: payload.metode,
      kode_voucher: payload.kodeVoucher,
      status: "lunas",
    });

    if (error) {
      return NextResponse.json({ message: "gagal sync", error }, { status: 500 });
    }
  }

  return NextResponse.json({ message: "berhasil disync" });
}