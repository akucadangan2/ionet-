// app/api/jaringan/set-bandwidth/route.ts
// Dipanggil dari dashboard - admin ubah limit upload/download pelanggan
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { setBandwidthQueue } from "@/lib/mikrotik/client";
import { getRouterConfigByPelanggan } from "@/lib/mikrotik/get-router-config";

export async function POST(req: NextRequest) {
  const { pelangganId, uploadLimit, downloadLimit } = await req.json();

  const { data: pelanggan, error } = await supabase
    .from("pelanggan")
    .select("*")
    .eq("id", pelangganId)
    .single();

  if (error || !pelanggan) {
    return NextResponse.json({ message: "pelanggan tidak ditemukan" }, { status: 404 });
  }

  const routerConfig = await getRouterConfigByPelanggan(pelangganId);
  await setBandwidthQueue(
    routerConfig,
    pelanggan.mikrotik_queue_target,
    uploadLimit,
    downloadLimit
  );

  await supabase
    .from("pelanggan")
    .update({ bandwidth_upload_limit: uploadLimit, bandwidth_download_limit: downloadLimit })
    .eq("id", pelangganId);

  return NextResponse.json({ message: "bandwidth berhasil diupdate" });
}