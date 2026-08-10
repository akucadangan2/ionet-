// lib/mikrotik/get-router-config.ts
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

interface MikrotikConfig {
  host: string;
  user: string;
  password: string;
  port?: number;
}

// Ambil kredensial Mikrotik berdasarkan router_id
export async function getRouterConfigById(routerId: string): Promise<MikrotikConfig> {
  const { data: router, error } = await supabase
    .from("router")
    .select("ip_address, api_username, api_password")
    .eq("id", routerId)
    .single();

  if (error || !router) throw new Error(`Router ${routerId} tidak ditemukan`);

  return {
    host: router.ip_address,
    user: router.api_username,
    password: router.api_password,
  };
}

// Ambil kredensial Mikrotik berdasarkan lokasi_id (ambil router pertama di lokasi itu)
// Dipakai kalau konteksnya cuma tau lokasi_id, belum tau router_id spesifik
export async function getRouterConfigByLokasi(lokasiId: string): Promise<MikrotikConfig> {
  const { data: router, error } = await supabase
    .from("router")
    .select("ip_address, api_username, api_password")
    .eq("lokasi_id", lokasiId)
    .limit(1)
    .single();

  if (error || !router) throw new Error(`Router untuk lokasi ${lokasiId} tidak ditemukan`);

  return {
    host: router.ip_address,
    user: router.api_username,
    password: router.api_password,
  };
}

// Ambil kredensial Mikrotik berdasarkan pelanggan_id (join lewat lokasi_id pelanggan)
export async function getRouterConfigByPelanggan(pelangganId: string): Promise<MikrotikConfig> {
  const { data: pelanggan, error } = await supabase
    .from("pelanggan")
    .select("lokasi_id")
    .eq("id", pelangganId)
    .single();

  if (error || !pelanggan) throw new Error(`Pelanggan ${pelangganId} tidak ditemukan`);

  return getRouterConfigByLokasi(pelanggan.lokasi_id);
}