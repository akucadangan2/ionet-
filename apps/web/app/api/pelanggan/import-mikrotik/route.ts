// app/api/pelanggan/import-mikrotik/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

const RELAY_URL = process.env.MIKROTIK_RELAY_URL!;
const RELAY_TOKEN = process.env.MIKROTIK_RELAY_TOKEN!;

export async function POST(req: NextRequest) {
  const { routerId } = await req.json();

  if (!routerId) {
    return NextResponse.json({ message: "routerId diperlukan" }, { status: 400 });
  }

  // Ambil lokasi_id dari router itu (buat dipasang ke pelanggan baru)
  const { data: router, error: routerError } = await supabase
    .from("router")
    .select("lokasi_id")
    .eq("id", routerId)
    .single();

  if (routerError || !router) {
    return NextResponse.json({ message: "router tidak ditemukan" }, { status: 404 });
  }

  // Tarik semua PPPoE secret dari Mikrotik lewat relay
  let secrets: any[];
  try {
    const res = await fetch(`${RELAY_URL}/mikrotik/ppp-secrets?routerId=${routerId}`, {
      headers: { Authorization: `Bearer ${RELAY_TOKEN}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "gagal ambil data dari relay");
    secrets = json.data;
  } catch (err) {
    return NextResponse.json({ message: `gagal konek ke Mikrotik: ${(err as Error).message}` }, { status: 500 });
  }

  // Ambil daftar paket_bulanan yang ada, buat dicocokin ke nama profile
  const { data: paketList } = await supabase.from("paket_bulanan").select("id, nama");

  // Ambil pelanggan yang udah ada (skip biar nggak dobel kalau di-import berkali-kali)
  const { data: existingPelanggan } = await supabase
    .from("pelanggan")
    .select("pppoe_username")
    .not("pppoe_username", "is", null);
  const existingUsernames = new Set((existingPelanggan ?? []).map((p) => p.pppoe_username));

  let imported = 0;
  let skipped = 0;

  for (const secret of secrets) {
    const username = secret.name;
    if (!username || existingUsernames.has(username)) {
      skipped++;
      continue;
    }

    const profileName = secret.profile || "";
    const matchedPaket = (paketList ?? []).find(
      (p) => p.nama.toLowerCase() === profileName.toLowerCase()
    );

    const { error } = await supabase.from("pelanggan").insert({
      nama: username, // sementara pakai username sebagai nama, admin bisa edit belakangan
      pppoe_username: username,
      tipe_langganan: "pppoe_bulanan",
      lokasi_id: router.lokasi_id,
      paket_bulanan_id: matchedPaket?.id ?? null,
      status: secret.disabled === "true" ? "nonaktif" : "aktif",
    });

    if (!error) imported++;
    else skipped++;
  }

  return NextResponse.json({
    message: `Import selesai: ${imported} pelanggan baru, ${skipped} dilewati (sudah ada/gagal)`,
    imported,
    skipped,
    total: secrets.length,
  });
}