// lib/notifications/get-contacts.ts
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function getActiveContacts(kategori?: "admin" | "teknisi") {
  let query = supabase.from("notification_contacts").select("no_hp, label").eq("aktif", true);
  if (kategori) query = query.eq("kategori", kategori);

  const { data } = await query;
  return data ?? [];
}