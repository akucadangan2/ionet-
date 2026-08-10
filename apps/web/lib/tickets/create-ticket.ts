// lib/tickets/create-ticket.ts
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/wa-gateway/client";
import { getActiveContacts } from "../notifications/get-contacts";
import { getActiveContacts } from "@/lib/notifications/get-contacts";

interface CreateTicketParams {
  lokasiId: string;
  routerId?: string;
  pelangganId?: string;
  jenis: "offline" | "sinyal_lemah" | "bandwidth";
  sumberUplinkId?: string;
  deskripsi: string;
}

// Cegah duplikat: cek dulu ada tiket "baru"/"ditangani" yang masih terbuka
// buat router/pelanggan yang sama sebelum bikin tiket baru
export async function createTicketIfNotExists(params: CreateTicketParams) {
  let query = supabase
    .from("tiket_gangguan")
    .select("id")
    .in("status", ["baru", "ditangani"])
    .eq("jenis", params.jenis);

  if (params.routerId) query = query.eq("router_id", params.routerId);
  if (params.pelangganId) query = query.eq("pelanggan_id", params.pelangganId);

  const { data: existing } = await query.maybeSingle();
  if (existing) {
    return { created: false, message: "tiket serupa masih terbuka" };
  }

  const { data: ticket, error } = await supabase
    .from("tiket_gangguan")
    .insert({
      lokasi_id: params.lokasiId,
      router_id: params.routerId,
      pelanggan_id: params.pelangganId,
      jenis: params.jenis,
      sumber_uplink_id: params.sumberUplinkId,
      status: "baru",
    })
    .select()
    .single();

  if (error) throw error;

 // Notif ke kontak admin & teknisi yang aktif (dikelola dari halaman Pengaturan)
  const contacts = await getActiveContacts();

  for (const contact of contacts) {
    await sendWhatsApp(
      contact.no_hp,
      `🔴 Tiket gangguan baru: ${params.deskripsi}\nJenis: ${params.jenis}\nCek dashboard buat detail & assign teknisi.`
    );
  }

  return { created: true, ticketId: ticket.id };
}