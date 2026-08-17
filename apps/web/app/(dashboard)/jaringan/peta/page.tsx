// app/(dashboard)/jaringan/peta/page.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase/client";

const NetworkMap = dynamic(() => import("@/components/NetworkMap"), { ssr: false });

export default function PetaPage() {
  const [routers, setRouters] = useState<any[]>([]);
  const [pelanggan, setPelanggan] = useState<any[]>([]);
  const [titikJaringan, setTitikJaringan] = useState<any[]>([]);
  const [jalurKabel, setJalurKabel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: routerData } = await supabase
        .from("router")
        .select("id, nama, latitude, longitude, status")
        .not("latitude", "is", null);

      const { data: pelangganData } = await supabase
        .from("pelanggan")
        .select(`
          id, nama, latitude, longitude, status, kml_kategori, kml_deskripsi,
          log_sinyal_olt(rx_power, tx_power, recorded_at)
        `)
        .not("latitude", "is", null)
        .order("recorded_at", { foreignTable: "log_sinyal_olt", ascending: false })
        .limit(1, { foreignTable: "log_sinyal_olt" });

      const { data: titikData } = await supabase
        .from("titik_jaringan")
        .select("*")
        .not("latitude", "is", null);
      setTitikJaringan(titikData ?? []);

      const { data: jalurData } = await supabase.from("jalur_kabel").select("*");
      setJalurKabel(jalurData ?? []);
      setRouters(routerData ?? []);
      setPelanggan(
        (pelangganData ?? []).map((p: any) => ({
          ...p,
          rxPower: p.log_sinyal_olt?.[0]?.rx_power,
          txPower: p.log_sinyal_olt?.[0]?.tx_power,
          kmlKategori: p.kml_kategori,
          kmlDeskripsi: p.kml_deskripsi,
        }))
      );
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat peta...</p>;

  const center: [number, number] =
    routers.length > 0 ? [routers[0].latitude, routers[0].longitude] : [-5.45, 105.27];

  const routerOnline = routers.filter((r) => r.status === "online").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Peta Jaringan</h1>
          <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
            {routerOnline}/{routers.length} router online &middot; {pelanggan.length} titik pelanggan
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#2FAE60", display: "inline-block" }} />
            Aktif Bulanan
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#E8B923", display: "inline-block" }} />
            Reseller Voucher
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3B82F6", display: "inline-block" }} />
            Modem Hotspot
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#D64545", display: "inline-block" }} />
            Minta Cabut
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#9CA3AF", display: "inline-block" }} />
            Tidak Aktif
          </span>
        </div>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--color-border)" }}
      >
        <NetworkMap routers={routers} pelanggan={pelanggan} titikJaringan={titikJaringan} jalurKabel={jalurKabel} center={center} />
      </div>
    </div>
  );
}