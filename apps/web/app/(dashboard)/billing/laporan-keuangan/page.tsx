// app/(dashboard)/billing/laporan-keuangan/page.tsx
"use client";

import { useState } from "react";

export default function LaporanKeuanganPage() {
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  function handleExportKeuangan() {
    const params = new URLSearchParams();
    if (dari) params.set("dari", dari);
    if (sampai) params.set("sampai", sampai);
    window.location.href = `/api/export/laporan-keuangan?${params.toString()}`;
  }

  function handleExportStatusPelanggan() {
    window.location.href = "/api/export/status-pelanggan";
  }

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Laporan Keuangan</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Export data keuangan & status pelanggan ke Excel
      </p>

      <div
        className="p-5 rounded-lg mb-4"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <h3 className="text-sm font-medium mb-3">Laporan Transaksi (Voucher + Langganan Bulanan)</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Dari Tanggal</label>
            <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Sampai Tanggal</label>
            <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} style={inputStyle} />
          </div>
          <button
            onClick={handleExportKeuangan}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--color-accent)" }}
          >
            Export ke Excel
          </button>
        </div>
      </div>

      <div
        className="p-5 rounded-lg"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <h3 className="text-sm font-medium mb-3">Daftar Status Pembayaran Pelanggan</h3>
        <p className="text-sm mb-3" style={{ color: "var(--color-ink-muted)" }}>
          Daftar lengkap pelanggan bulanan beserta status lunas/belum lunas saat ini
        </p>
        <button
          onClick={handleExportStatusPelanggan}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--color-accent)" }}
        >
          Export ke Excel
        </button>
      </div>
    </div>
  );
}