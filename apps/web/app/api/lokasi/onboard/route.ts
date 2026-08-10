// app/api/lokasi/onboard/route.ts
// Dipanggil dari dashboard - proses onboarding lokasi baru (setelah WireGuard di-setup manual)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { registerNas } from "@/lib/radius/client";

export async function POST(req: NextRequest) {
  const { lokasiId, routerId, nasIp } = await req.json();

  try {
    const nasResult = await registerNas(routerId, nasIp);

    await supabase
      .from("lokasi")
      .update({ wireguard_status: "connected" })
      .eq("id", lokasiId);

    return NextResponse.json({
      message: `Lokasi berhasil di-onboard, NAS "${nasResult.shortname}" terdaftar di RADIUS`,
    });
  } catch (err) {
    return NextResponse.json(
      { message: `gagal onboarding: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}