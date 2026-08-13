// lib/payment/process-payment.ts
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { addHotspotUser } from "@/lib/mikrotik/client";
import { sendWhatsApp } from "@/lib/wa-gateway/client";
import { getRouterConfigByLokasi } from "@/lib/mikrotik/get-router-config";
import { createStrukVoucher } from "@/lib/struk/generate-struk";
import { getActiveContacts } from "@/lib/notifications/get-contacts";

// Dipanggil dari webhook DOKU ATAU dari poller/cron fallback - logic sama persis
export async function processPaymentSuccess(orderId: string) {
  const { data: voucherTx } = await supabase
    .from("transaksi_voucher")
    .select("*, paket_voucher(*)")
    .eq("id", orderId)
    .maybeSingle();

  if (voucherTx) {
    if (voucherTx.status === "lunas") {
      return { message: "sudah diproses sebelumnya" };
    }

    const kodeVoucher = `V${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(-3).toUpperCase()}`;
    const username = kodeVoucher;
    const password = kodeVoucher;

    const routerConfig = await getRouterConfigByLokasi(voucherTx.lokasi_id);
    await addHotspotUser(
      routerConfig,
      username,
      password,
      voucherTx.paket_voucher.profile_mikrotik
    );

    await supabase
      .from("transaksi_voucher")
      .update({
        status: "lunas",
        kode_voucher: `${username}/${password}`,
        dibayar_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    // Buat struk setelah pembayaran lunas
    const struk = await createStrukVoucher(orderId);

    if (voucherTx.no_hp_pembeli) {
      await sendWhatsApp(
        voucherTx.no_hp_pembeli,
        `Pembayaran berhasil! Voucher kamu:\nUsername: ${username}\nPassword: ${password}\n\nStruk: ${process.env.NEXT_PUBLIC_APP_URL}/struk/${struk.id}`
      );
    }

    return { message: "voucher berhasil dibuat" };
  }

  const { data: monthlyPayment } = await supabase
    .from("pembayaran_bulanan")
    .select("*, pelanggan(*)")
    .eq("id", orderId)
    .maybeSingle();

  if (monthlyPayment) {
    if (monthlyPayment.status !== "pending") {
      return { message: "sudah diproses sebelumnya" };
    }

    await supabase
      .from("pembayaran_bulanan")
      .update({ status: "menunggu_validasi" })
      .eq("id", orderId);

    const adminContacts = await getActiveContacts("admin");
    for (const contact of adminContacts) {
      await sendWhatsApp(
        contact.no_hp,
        `Ada pembayaran langganan bulanan masuk (${monthlyPayment.pelanggan?.nama}), menunggu validasi di dashboard.`
      );
    }

    return { message: "menunggu validasi admin" };
  }

  return { message: "order tidak ditemukan" };
}