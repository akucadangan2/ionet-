// app/(dashboard)/jaringan/radius/page.tsx
"use client";

import { useEffect, useState } from "react";

interface RadiusRouter {
  id: string;
  nama: string;
  ip_address: string;
  radius_registered: boolean;
  status: string;
  activeSessions: number;
  lokasi: { nama: string } | null;
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

  if (loading) return <p>Memuat...</p>;

  const totalSesiAktif = routers.reduce((sum, r) => sum + r.activeSessions, 0);
  const totalTerdaftar = routers.filter((r) => r.radius_registered).length;

  return (
    <div>
      <h1>Status RADIUS Terpusat</h1>

      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div style={{ border: "1px solid #ccc", padding: 15 }}>
          <p>Total NAS Terdaftar</p>
          <h2>{totalTerdaftar} / {routers.length}</h2>
        </div>
        <div style={{ border: "1px solid #ccc", padding: 15 }}>
          <p>Total Sesi Aktif</p>
          <h2>{totalSesiAktif}</h2>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Lokasi</th>
            <th>Router (NAS)</th>
            <th>IP</th>
            <th>Status Router</th>
            <th>Terdaftar di RADIUS</th>
            <th>Sesi Aktif</th>
          </tr>
        </thead>
        <tbody>
          {routers.map((r) => (
            <tr key={r.id}>
              <td>{r.lokasi?.nama ?? "-"}</td>
              <td>{r.nama}</td>
              <td>{r.ip_address}</td>
              <td style={{ color: r.status === "online" ? "green" : "red" }}>{r.status}</td>
              <td>{r.radius_registered ? "✅ Ya" : "❌ Belum"}</td>
              <td>{r.activeSessions}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 20, fontSize: 14, color: "#666" }}>
        Catatan: kolom "Sesi Aktif" cuma akurat kalau FreeRADIUS udah dikonfigurasi
        buat kirim data accounting ke tabel <code>radacct</code> — lihat{" "}
        <code>docs/setup-radius-accounting.md</code>.
      </p>
    </div>
  );
}