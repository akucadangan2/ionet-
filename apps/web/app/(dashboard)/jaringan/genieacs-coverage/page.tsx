"use client";

import { useEffect, useState } from "react";

interface PelangganItem {
  nama: string;
  pppoe_username: string;
}

export default function GenieAcsCoveragePage() {
  const [loading, setLoading] = useState(true);
  const [totalPelanggan, setTotalPelanggan] = useState(0);
  const [totalDevice, setTotalDevice] = useState(0);
  const [sudah, setSudah] = useState<PelangganItem[]>([]);
  const [belum, setBelum] = useState<PelangganItem[]>([]);
  const [tab, setTab] = useState<"belum" | "sudah">("belum");

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/genieacs/coverage");
    const json = await res.json();
    setTotalPelanggan(json.totalPelanggan || 0);
    setTotalDevice(json.totalDeviceGenieacs || 0);
    setSudah(json.sudah || []);
    setBelum(json.belum || []);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, []);

  const list = tab === "belum" ? belum : sudah;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">Cakupan GenieACS</h1>
        <button onClick={loadData} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)" }}>
          Refresh
        </button>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Bandingkan pelanggan terdaftar dengan device yang sudah terhubung ke GenieACS
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--color-ink-muted)" }}>Total Pelanggan (PPPoE)</p>
          <p className="text-xl font-semibold">{totalPelanggan}</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--color-ink-muted)" }}>Sudah di GenieACS</p>
          <p className="text-xl font-semibold" style={{ color: "var(--color-signal-good)" }}>{sudah.length}</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--color-ink-muted)" }}>Belum</p>
          <p className="text-xl font-semibold" style={{ color: "var(--color-signal-bad)" }}>{belum.length}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={function () { setTab("belum"); }}
          className="px-3 py-1.5 rounded text-sm"
          style={{ border: "1px solid var(--color-border)", background: tab === "belum" ? "var(--color-accent)" : "transparent", color: tab === "belum" ? "white" : "var(--color-ink)" }}
        >
          Belum ({belum.length})
        </button>
        <button
          onClick={function () { setTab("sudah"); }}
          className="px-3 py-1.5 rounded text-sm"
          style={{ border: "1px solid var(--color-border)", background: tab === "sudah" ? "var(--color-accent)" : "transparent", color: tab === "sudah" ? "white" : "var(--color-ink)" }}
        >
          Sudah ({sudah.length})
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
                <th className="text-left p-3 text-sm">Nama Pelanggan</th>
                <th className="text-left p-3 text-sm">Username PPPoE</th>
              </tr>
            </thead>
            <tbody>
              {list.map(function (p, i) {
                return (
                  <tr key={i} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="p-3 text-sm">{p.nama}</td>
                    <td className="p-3 text-sm mono">{p.pppoe_username}</td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                    Tidak ada data
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