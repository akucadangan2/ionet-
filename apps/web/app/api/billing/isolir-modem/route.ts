// app/api/billing/isolir-modem/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { getPppoeProfile, setPppoeProfile } from "@/lib/mikrotik/client";
import { getRouterConfigByLokasi } from "@/lib/mikrotik/get-router-config";

export async function POST(req: NextRequest) {
  try {
    const { pelangganId, aksi } = await req.json();
    if (!pelangganId) {
      return NextResponse.json({ message: "pelangganId diperlukan" }, { status: 400 });
    }
    if (aksi !== "isolir" && aksi !== "aktifkan") {
      return NextResponse.json({ message: "aksi harus 'isolir' atau 'aktifkan'" }, { status: 400 });
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

    if (aksi === "isolir") {
      // simpen profile asli (10MBPS/20MBPS) dulu sebelum ditimpa ISOLIR
      const profilAsli = await getPppoeProfile(routerConfig, pelanggan.pppoe_username);
      await setPppoeProfile(routerConfig, pelanggan.pppoe_username, "ISOLIR");

      await supabase
        .from("pelanggan")
        .update({ status: "isolir", profil_sebelum_isolir: profilAsli })
        .eq("id", pelangganId);

      return NextResponse.json({ message: "Pelanggan berhasil diisolir" });
    } else {
      // aktifkan: balikin ke profile asli sebelum diisolir
      const profilTujuan = pelanggan.profil_sebelum_isolir;
      if (!profilTujuan) {
        return NextResponse.json(
          { message: "Nggak ada data profile asli, nggak bisa dibalikin otomatis" },
          { status: 400 }
        );
      }

      await setPppoeProfile(routerConfig, pelanggan.pppoe_username, profilTujuan);

      await supabase
        .from("pelanggan")
        .update({ status: "aktif", profil_sebelum_isolir: null })
        .eq("id", pelangganId);

      return NextResponse.json({ message: "Pelanggan berhasil diaktifkan kembali" });
    }
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}