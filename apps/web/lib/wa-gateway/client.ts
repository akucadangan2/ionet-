// lib/wa-gateway/client.ts
const WA_GATEWAY_TOKEN = process.env.WA_GATEWAY_TOKEN!;
const WA_GATEWAY_BASE_URL = process.env.WA_GATEWAY_BASE_URL || "https://api.fonnte.com";

// Format nomor: Fonnte otomatis ganti 0 di depan jadi 62, tapi kita rapikan
// juga di sisi kita biar konsisten (jaga-jaga kalau format dari database beda-beda)
function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) return `62${cleaned.slice(1)}`;
  if (cleaned.startsWith("62")) return cleaned;
  return `62${cleaned}`;
}

export async function sendWhatsApp(phone: string, message: string) {
  const target = normalizePhoneNumber(phone);

  const formData = new FormData();
  formData.append("target", target);
  formData.append("message", message);
  formData.append("countryCode", "62");

  const res = await fetch(`${WA_GATEWAY_BASE_URL}/send`, {
    method: "POST",
    headers: {
      Authorization: WA_GATEWAY_TOKEN,
    },
    body: formData,
  });

  const result = await res.json();

  if (!res.ok || result?.status === false) {
    console.error(`Gagal kirim WA ke ${target}:`, result);
    throw new Error(`Gagal kirim WA: ${result?.reason ?? "unknown error"}`);
  }

  return result;
}