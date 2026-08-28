"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

interface PelangganItem {
  nama: string;
  pppoe_username: string;
  status?: string;
  catatan?: string | null;
}

const statusOptions = [
  { value: "belum_dicoba", label: "Belum Dicoba" },
  { value: "password_salah", label: "Password Salah" },
  { value: "offline", label: "Offline/Timeout" },
  { value: "dns_error", label: "Error DNS" },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  belum_dicoba: { bg: "#F0F0F0", color: "#666" },
  password_salah: { bg: "#FBE2E2", color: "#C0392B" },
  offline: { bg: "#FDEEDB", color: "#B5730B" },
  dns_error: { bg: "#DDEBFF", color: "#1D5FBF" },
};

export default function GenieAcsCoveragePage() {
  const [loading, setLoading] = useState(true);
  const [totalPelanggan, setTotalPelanggan] = useState(0);
  const [sudah, setSudah] = useState<PelangganItem[]>([]);
  const [belum, setBelum] = useState<PelangganItem[]>([]);
  const [tab, setTab] = useState<"belum" | "sudah">("belum");
  const [savingUsername, setSavingUsername] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/genieacs/coverage");
    const json = await res.json();
    setTotalPelanggan(json.totalPelanggan || 0);
    setSudah(json.sudah || []);
    setBelum(json.belum || []);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, []);

  async function handleUpdateStatus(pppoeUsername: string, status: string) {
    setSavingUsername(pppoeUsername);
    await fetch("/api/genieacs/status", {
      method: "POST",
      body: JSON.stringify({ pppoeUsername, status }),
    });
    setBelum(function (prev) {
      return prev.map(function (p) {
        return p.pppoe_username === pppoeUsername ? { ...p, status } : p;
      });
    });
    setSavingUsername(null);
  }

  function handleExportExcel() {
    const dataSudah = sudah.map(function (p) {
      return {
        Nama: p.nama,
        "Username PPPoE": p.pppoe_username,
        Status: "Sudah Terhubung",
      };
    });

    const dataBelum = belum.map(function (p) {
      const label = statusOptions.find(function (o) { return o.value === (p.status || "belum_dicoba"); })?.label || "Belum Dicoba";
      return {
        Nama: p.nama,
        "Username PPPoE": p.pppoe_username,
        Status: label,
        Catatan: p.catatan || "",
      };
    });

    const wb = XLSX.utils.book_new();
    const wsSudah = XLSX.utils.json_to_sheet(dataSudah);
    const wsBelum = XLSX.utils.json_to_sheet(dataBelum);
    XLSX.utils.book_append_sheet(wb, wsBelum, "Belum");
    XLSX.utils.book_append_sheet(wb, wsSudah, "Sudah");

    const tanggal = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `cakupan-genieacs-${tanggal}.xlsx`);
  }

  const list = tab === "belum" ? belum : sudah;
  const belumDicoba = belum.filter(function (p) { return !p.status || p.status === "belum_dicoba"; }).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">Cakupan GenieACS</h1>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)" }}>
            Export Excel
          </button>
          <button onClick={loadData} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)" }}>
            Refresh
          </button>
        </div>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        {sudah.length} sudah terhubung, {belumDicoba} belum pernah dicoba dari {belum.length} yang belum berhasil
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--color-ink-muted)" }}>Total Pelanggan</p>
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
                {tab === "belum" && <th className="text-left p-3 text-sm">Status</th>}
              </tr>
            </thead>
            <tbody>
              {list.map(function (p, i) {
                return (
                  <tr key={i} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="p-3 text-sm">{p.nama}</td>
                    <td className="p-3 text-sm mono">{p.pppoe_username}</td>
                    {tab === "belum" && (
                      <td className="p-3">
                        <select
                          value={p.status || "belum_dicoba"}
                          onChange={function (e) { handleUpdateStatus(p.pppoe_username, e.target.value); }}
                          disabled={savingUsername === p.pppoe_username}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            background: statusStyle[p.status || "belum_dicoba"]?.bg,
                            color: statusStyle[p.status || "belum_dicoba"]?.color,
                            border: "none",
                          }}
                        >
                          {statusOptions.map(function (opt) {
                            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                          })}
                        </select>
                      </td>
                    )}
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
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