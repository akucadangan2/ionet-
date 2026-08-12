import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

function normalizeNama(nama: string): string {
  return nama.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows: { nama: string; lat: number; lng: number }[] = body.rows;

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ message: "Format data tidak valid" }, { status: 400 });
    }

    const { data: pelangganList } = await supabase
      .from("pelanggan")
      .select("id, nama, pppoe_username");

    const lookupMap: Record<string, string> = {};
    (pelangganList || []).forEach((p) => {
      if (p.nama) lookupMap[normalizeNama(p.nama)] = p.id;
      if (p.pppoe_username) lookupMap[normalizeNama(p.pppoe_username)] = p.id;
    });

    let matched = 0;
    let unmatched: string[] = [];

    for (const row of rows) {
      const key = normalizeNama(row.nama);
      const pelangganId = lookupMap[key];

      if (!pelangganId) {
        unmatched.push(row.nama);
        continue;
      }

      const { error } = await supabase
        .from("pelanggan")
        .update({ latitude: row.lat, longitude: row.lng })
        .eq("id", pelangganId);

      if (!error) matched++;
      else unmatched.push(row.nama);
    }

    return NextResponse.json({ matched, unmatched, total: rows.length });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}