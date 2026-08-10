// lib/struk/generate-struk.ts
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

async function generateNomorStruk(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");

  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const { count } = await supabase
    .from("struk")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfDay);

  const urutan = String((count ?? 0) + 1).padStart(4, "0");
  return `STR-${dateStr}-${urutan}`;
}

export async function createStrukVoucher(transaksiVoucherId: string) {
  const nomorStruk = await generateNomorStruk();

  const { data, error } = await supabase
    .from("struk")
    .insert({ transaksi_voucher_id: transaksiVoucherId, nomor_struk: nomorStruk })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createStrukBulanan(pembayaranBulananId: string) {
  const nomorStruk = await generateNomorStruk();

  const { data, error } = await supabase
    .from("struk")
    .insert({ pembayaran_bulanan_id: pembayaranBulananId, nomor_struk: nomorStruk })
    .select()
    .single();

  if (error) throw error;
  return data;
}