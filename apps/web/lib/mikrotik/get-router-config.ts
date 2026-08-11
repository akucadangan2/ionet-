// lib/mikrotik/get-router-config.ts
// Sekarang cuma cari routerId-nya - kredensial (host/user/password) udah nggak
// disimpan/diakses di Next.js sama sekali, itu tugasnya relay di PC toko
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function getRouterConfigById(routerId: string): Promise<string> {
  const { data: router, error } = await supabase
    .from("router")
    .select("id")
    .eq("id", routerId)
    .single();

  if (error || !router) throw new Error(`Router ${routerId} tidak ditemukan`);
  return router.id;
}

export async function getRouterConfigByLokasi(lokasiId: string): Promise<string> {
  const { data: router, error } = await supabase
    .from("router")
    .select("id")
    .eq("lokasi_id", lokasiId)
    .limit(1)
    .single();

  if (error || !router) throw new Error(`Router untuk lokasi ${lokasiId} tidak ditemukan`);
  return router.id;
}

export async function getRouterConfigByPelanggan(pelangganId: string): Promise<string> {
  const { data: pelanggan, error } = await supabase
    .from("pelanggan")
    .select("lokasi_id")
    .eq("id", pelangganId)
    .single();

  if (error || !pelanggan) throw new Error(`Pelanggan ${pelangganId} tidak ditemukan`);
  return getRouterConfigByLokasi(pelanggan.lokasi_id);
}