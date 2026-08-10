// app/api/billing/activate-modem/route.ts
// Tombol terpisah - aktivasi modem tetap manual setelah validasi (sesuai requirement client)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { setPPPoEStatus } from "@/lib/mikrotik/client";
import { getRouterConfigByPelanggan } from "@/lib/mikrotik/get-router-config";

export async function POST(req: NextRequest) {
  const { pelangganId } = await req.json();

  const { data: pelanggan, error } = await supabase
    .from("pelanggan")
    .select("*, router:lokasi_id(*)")
    .eq("id", pelangganId)
    .single();

  if (error || !pelanggan) {
    return NextResponse.json({ message: "pelanggan tidak ditemukan" }, { status: 404 });
  }

  try {
    // Ambil konfigurasi router secara dinamis berdasarkan pelangganId
    const routerConfig = await getRouterConfigByPelanggan(pelangganId);

    // Kirim command ke Mikrotik menggunakan konfigurasi dari database
    await setPPPoEStatus(
      routerConfig,
      pelanggan.pppoe_username,
      true
    );

    // Update status pelanggan di database menjadi aktif
    await supabase.from("pelanggan").update({ status: "aktif" }).eq("id", pelangganId);

    return NextResponse.json({ message: "modem berhasil diaktifkan" });
  } catch (err: any) {
    console.error("Gagal mengaktifkan modem:", err);
    return NextResponse.json(
      { message: "Gagal terhubung ke router atau konfigurasi tidak ditemukan", error: err.message }, 
      { status: 500 }
    );
  }
}