// lib/radius/client.ts
import crypto from "crypto";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

// Generate secret unik buat NAS baru, disimpan di tabel router + didaftarkan ke FreeRADIUS
export async function registerNas(routerId: string, nasIp: string) {
  const secret = crypto.randomBytes(16).toString("hex");

  const { data: router, error } = await supabase
    .from("router")
    .select("nama, lokasi_id")
    .eq("id", routerId)
    .single();

  if (error || !router) throw new Error("Router tidak ditemukan");

  // Simpan secret ke tabel dulu
  await supabase
    .from("router")
    .update({ radius_nas_secret: secret, radius_registered: true })
    .eq("id", routerId);

  // TODO: panggil FreeRADIUS API/SQL buat insert ke tabel `nas` beneran
  // (FreeRADIUS baca NAS list dari SQL kalau pakai rlm_sql, bukan cuma clients.conf)
  const { error: nasError } = await supabase.rpc("insert_radius_nas", {
    p_nasname: nasIp,
    p_shortname: router.nama,
    p_secret: secret,
  });

  if (nasError) throw nasError;

  return { nasIp, secret, shortname: router.nama };
}

// Sinkron user PPPoE/hotspot pelanggan ke tabel radcheck FreeRADIUS
export async function syncRadiusUser(username: string, password: string) {
  const { error } = await supabase.rpc("upsert_radius_user", {
    p_username: username,
    p_password: password,
  });

  if (error) throw error;
  return { message: "user berhasil disinkron ke RADIUS" };
}

export async function removeRadiusUser(username: string) {
  const { error } = await supabase.rpc("delete_radius_user", { p_username: username });
  if (error) throw error;
  return { message: "user berhasil dihapus dari RADIUS" };
}