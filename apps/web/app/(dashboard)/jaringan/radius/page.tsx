// app/(dashboard)/jaringan/radius/page.tsx
"use client";

import { useEffect, useState } from "react";
import SignalIndicator from "@/components/SignalIndicator";

interface RadiusRouter {
  id: string; nama: string; ip_address: string; radius_registered: boolean;
  status: string; activeSessions: number; lokasi: { nama: string } | null;
}

export default function RadiusPage() {
  const [routers, setRouters] = useState<RadiusRouter[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/radius/status");
    const json = await res.json();
    setRouters(json.routers ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  const totalSesiAktif = routers.reduce((sum, r) => sum + r.activeSessions, 0);
  const totalTerdaftar = routers.filter((r) => r.radius_registered).length;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Status RADIUS Terpusat</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--color-ink-muted)" }}>NAS Terdaftar</p>
          <p className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>{totalTerdaftar} / {routers.length}</p>
        </div>
        <div className="p-5 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--color-ink-muted)" }}>Sesi Aktif</p>
          <p className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>{totalSesiAktif}</p>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table>
          <thead>
            <tr><th>Lokasi</th><th>Router (NAS)</th><th>IP</th><th>Status</th><th>RADIUS</th><th>Sesi Aktif</th></tr>
          </thead>
          <tbody>
            {routers.map((r) => (
              <tr key={r.id}>
                <td>{r.lokasi?.nama ?? "-"}</td>
                <td>{r.nama}</td>
                <td className="mono">{r.ip_address}</td>
                <td><SignalIndicator level={r.status === "online" ? 4 : 0} label={r.status} /></td>
                <td>{r.radius_registered ? "✅ Ya" : "❌ Belum"}</td>
                <td>{r.activeSessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm" style={{ color: "var(--color-ink-muted)" }}>
        Kolom "Sesi Aktif" akurat setelah FreeRADIUS dikonfigurasi kirim data accounting — lihat{" "}
        <code className="mono">docs/setup-radius-accounting.md</code>.
      </p>
    </div>
  );
}