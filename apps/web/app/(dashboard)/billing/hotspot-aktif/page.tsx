"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface ActiveUser {
  user: string;
  address: string;
  "mac-address": string;
  uptime: string;
  "bytes-in": string;
  "bytes-out": string;
}

interface RouterItem {
  id: string;
  nama: string;
}

function formatBytes(str: string) {
  const bytes = Number(str) || 0;
  const mb = bytes / 1024 / 1024;
  return mb > 1024 ? (mb / 1024).toFixed(2) + " GB" : mb.toFixed(1) + " MB";
}

export default function HotspotAktifPage() {
  const [routerList, setRouterList] = useState<RouterItem[]>([]);
  const [selectedRouter, setSelectedRouter] = useState("");
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(function () {
    async function loadRouters() {
      const result = await supabase.from("router").select("id, nama");
      setRouterList(result.data || []);
      if (result.data && result.data.length > 0) setSelectedRouter(result.data[0].id);
    }
    loadRouters();
  }, []);

  async function loadActiveUsers() {
    if (!selectedRouter) return;
    setError("");
    try {
      const res = await fetch("/api/mikrotik/hotspot-active?routerId=" + selectedRouter);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setUsers(json.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    if (!selectedRouter) return;
    loadActiveUsers();
    const interval = setInterval(loadActiveUsers, 15000);
    return function () { clearInterval(interval); };
  }, [selectedRouter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">Hotspot Aktif Real-Time</h1>
        <select
          value={selectedRouter}
          onChange={function (e) { setSelectedRouter(e.target.value); }}
          style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "6px 12px" }}
        >
          {routerList.map(function (r) {
            return <option key={r.id} value={r.id}>{r.nama}</option>;
          })}
        </select>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        {users.length} pengguna sedang online, refresh otomatis tiap 15 detik
      </p>

      {loading && <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>}
      {error && <p style={{ color: "var(--color-signal-bad)" }}>{error}</p>}

      {!loading && !error && (
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
                <th className="text-left p-3 text-sm">Kode Voucher</th>
                <th className="text-left p-3 text-sm">IP Address</th>
                <th className="text-left p-3 text-sm">MAC Address</th>
                <th className="text-left p-3 text-sm">Durasi Online</th>
                <th className="text-left p-3 text-sm">Data Terpakai</th>
              </tr>
            </thead>
            <tbody>
              {users.map(function (u, i) {
                const bytesIn = Number(u["bytes-in"]) || 0;
                const bytesOut = Number(u["bytes-out"]) || 0;
                return (
                  <tr key={i} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="p-3 text-sm mono">{u.user}</td>
                    <td className="p-3 text-sm mono">{u.address}</td>
                    <td className="p-3 text-sm mono">{u["mac-address"]}</td>
                    <td className="p-3 text-sm">{u.uptime}</td>
                    <td className="p-3 text-sm">{formatBytes((bytesIn + bytesOut).toString())}</td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                    Tidak ada pengguna hotspot yang sedang online
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}