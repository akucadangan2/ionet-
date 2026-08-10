// app/(dashboard)/tiket/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import SignalIndicator from "@/components/SignalIndicator";

interface Tiket {
  id: string;
  jenis: string;
  status: string;
  terdeteksi_at: string;
  selesai_at: string | null;
  assigned_to: string | null;
  router: { nama: string } | null;
  pelanggan: { nama: string } | null;
}

interface Teknisi {
  id: string;
  nama: string;
}

const jenisLabel: Record<string, string> = {
  offline: "Router Offline",
  sinyal_lemah: "Sinyal Lemah",
  bandwidth: "Gangguan Bandwidth",
};

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  baru: { bg: "#FDEEDB", color: "#B5730B", label: "Baru" },
  ditangani: { bg: "#DDEBFF", color: "#1D5FBF", label: "Ditangani" },
  selesai: { bg: "#DCF5E4", color: "#1D8348", label: "Selesai" },
};

export default function TiketPage() {
  const [tikets, setTikets] = useState<Tiket[]>([]);
  const [teknisiList, setTeknisiList] = useState<Teknisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("semua");

  async function loadData() {
    setLoading(true);

    let query = supabase
      .from("tiket_gangguan")
      .select("*, router:router_id(nama), pelanggan:pelanggan_id(nama)")
      .order("terdeteksi_at", { ascending: false });

    if (filterStatus !== "semua") {
      query = query.eq("status", filterStatus);
    }

    const { data: tiketData } = await query;
    const { data: staffData } = await supabase.from("staff").select("id, nama").eq("role", "teknisi");

    setTikets(tiketData ?? []);
    setTeknisiList(staffData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  async function handleAssign(ticketId: string, teknisiId: string) {
    await fetch("/api/tickets/assign", { method: "POST", body: JSON.stringify({ ticketId, teknisiId }) });
    loadData();
  }

  async function handleSelesai(ticketId: string) {
    await fetch("/api/tickets/resolve", { method: "POST", body: JSON.stringify({ ticketId }) });
    loadData();
  }

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Tiket Gangguan</h1>
          <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
            {tikets.filter((t) => t.status !== "selesai").length} tiket masih terbuka
          </p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
        >
          <option value="semua">Semua Status</option>
          <option value="baru">Baru</option>
          <option value="ditangani">Ditangani</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table>
          <thead>
            <tr>
              <th>Status Koneksi</th>
              <th>Jenis</th>
              <th>Sumber</th>
              <th>Terdeteksi</th>
              <th>Status Tiket</th>
              <th>Teknisi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tikets.map((t) => (
              <tr key={t.id}>
                <td>
                  <SignalIndicator level={t.status === "selesai" ? 4 : 0} />
                </td>
                <td>{jenisLabel[t.jenis] ?? t.jenis}</td>
                <td className="mono">{t.router?.nama ?? t.pelanggan?.nama ?? "-"}</td>
                <td style={{ color: "var(--color-ink-muted)" }}>
                  {new Date(t.terdeteksi_at).toLocaleString("id-ID")}
                </td>
                <td>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ background: statusStyle[t.status]?.bg, color: statusStyle[t.status]?.color }}
                  >
                    {statusStyle[t.status]?.label ?? t.status}
                  </span>
                </td>
                <td>
                  {t.status !== "selesai" ? (
                    <select
                      value={t.assigned_to ?? ""}
                      onChange={(e) => handleAssign(t.id, e.target.value)}
                      className="px-2 py-1 rounded text-sm"
                      style={{ border: "1px solid var(--color-border)" }}
                    >
                      <option value="">- pilih teknisi -</option>
                      {teknisiList.map((tek) => (
                        <option key={tek.id} value={tek.id}>{tek.nama}</option>
                      ))}
                    </select>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {t.status !== "selesai" && (
                    <button
                      onClick={() => handleSelesai(t.id)}
                      className="px-3 py-1.5 rounded text-sm text-white"
                      style={{ background: "var(--color-signal-good)" }}
                    >
                      Tandai Selesai
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {tikets.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8" style={{ color: "var(--color-ink-muted)" }}>
                  Tidak ada tiket untuk filter ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}