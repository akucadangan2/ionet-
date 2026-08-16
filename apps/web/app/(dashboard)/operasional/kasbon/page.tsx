"use client";

import { useEffect, useState } from "react";

interface KasbonRecord {
  id: string;
  jumlah: number;
  alasan: string | null;
  status: string;
  sisa_saldo: number | null;
  tanggal_pengajuan: string;
  karyawan: { nama: string; jabatan: string } | null;
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#FDEEDB", color: "#B5730B" },
  disetujui: { bg: "#DCF5E4", color: "#1D8348" },
  ditolak: { bg: "#FBE2E2", color: "#C0392B" },
  lunas: { bg: "#DDEBFF", color: "#1D5FBF" },
};

export default function KasbonAdminPage() {
  const [records, setRecords] = useState<KasbonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/kasbon");
    const json = await res.json();
    setRecords(json.data || []);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, []);

  async function handleProses(id: string, status: string, jumlah: number) {
    await fetch("/api/kasbon", {
      method: "PATCH",
      body: JSON.stringify({ id, status, jumlah }),
    });
    loadData();
  }

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Pengajuan Kasbon</h1>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--color-bg)" }}>
              <th className="text-left p-3 text-sm">Nama</th>
              <th className="text-left p-3 text-sm">Jumlah</th>
              <th className="text-left p-3 text-sm">Alasan</th>
              <th className="text-left p-3 text-sm">Sisa Saldo</th>
              <th className="text-left p-3 text-sm">Status</th>
              <th className="text-left p-3 text-sm">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {records.map(function (r) {
              return (
                <tr key={r.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td className="p-3 text-sm font-medium">{r.karyawan?.nama || "-"}</td>
                  <td className="p-3 text-sm">{formatRupiah(r.jumlah)}</td>
                  <td className="p-3 text-sm" style={{ color: "var(--color-ink-muted)" }}>{r.alasan || "-"}</td>
                  <td className="p-3 text-sm">{r.sisa_saldo !== null ? formatRupiah(r.sisa_saldo) : "-"}</td>
                  <td className="p-3 text-sm">
                    <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: statusStyle[r.status]?.bg, color: statusStyle[r.status]?.color }}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <button
                          onClick={function () { handleProses(r.id, "disetujui", r.jumlah); }}
                          className="px-2 py-1 rounded text-xs text-white"
                          style={{ background: "var(--color-signal-good)" }}
                        >
                          Setujui
                        </button>
                        <button
                          onClick={function () { handleProses(r.id, "ditolak", r.jumlah); }}
                          className="px-2 py-1 rounded text-xs"
                          style={{ border: "1px solid var(--color-signal-bad)", color: "var(--color-signal-bad)" }}
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                  Belum ada pengajuan kasbon
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}