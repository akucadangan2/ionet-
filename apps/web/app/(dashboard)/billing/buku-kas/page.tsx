"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

interface KasEntry {
  tanggal: string;
  keterangan: string;
  kategori: string;
  tipe: "masuk" | "keluar";
  nominal: number;
  saldo: number;
  sourceType?: "voucher" | "bulanan";
  sourceId?: string;
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatTanggal(t: string) {
  return new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function BukuKasPage() {
  const [entries, setEntries] = useState<KasEntry[]>([]);
  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalKeluar, setTotalKeluar] = useState(0);
  const [saldoAkhir, setSaldoAkhir] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tanggal: new Date().toISOString().slice(0, 10), keterangan: "", kategori: "", tipe: "keluar", nominal: "" });

  async function loadData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (dari) params.set("dari", dari);
    if (sampai) params.set("sampai", sampai);
    const res = await fetch("/api/buku-kas?" + params.toString());
    const json = await res.json();
    setEntries(json.entries || []);
    setTotalMasuk(json.totalMasuk || 0);
    setTotalKeluar(json.totalKeluar || 0);
    setSaldoAkhir(json.saldoAkhir || 0);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, []);

  async function handleSimpan() {
    await fetch("/api/buku-kas", {
      method: "POST",
      body: JSON.stringify({
        tanggal: form.tanggal,
        keterangan: form.keterangan,
        kategori: form.kategori,
        tipe: form.tipe,
        nominal: parseFloat(form.nominal),
      }),
    });
    setShowForm(false);
    setForm({ tanggal: new Date().toISOString().slice(0, 10), keterangan: "", kategori: "", tipe: "keluar", nominal: "" });
    loadData();
  }

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Buku Kas</h1>
        <button
          onClick={function () { setShowForm(true); }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--color-accent)" }}
        >
          + Catat Transaksi
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--color-ink-muted)" }}>Total Pemasukan</p>
          <p className="text-xl font-semibold" style={{ color: "var(--color-signal-good)" }}>{formatRupiah(totalMasuk)}</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--color-ink-muted)" }}>Total Pengeluaran</p>
          <p className="text-xl font-semibold" style={{ color: "var(--color-signal-bad)" }}>{formatRupiah(totalKeluar)}</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--color-ink-muted)" }}>Saldo Akhir</p>
          <p className="text-xl font-semibold">{formatRupiah(saldoAkhir)}</p>
        </div>
      </div>

      <div className="flex gap-3 items-end mb-4">
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Dari Tanggal</label>
          <input type="date" value={dari} onChange={function (e) { setDari(e.target.value); }} style={inputStyle} />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Sampai Tanggal</label>
          <input type="date" value={sampai} onChange={function (e) { setSampai(e.target.value); }} style={inputStyle} />
        </div>
        <button onClick={loadData} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)" }}>Filter</button>
      </div>

      {showForm && (
        <div className="p-5 rounded-lg mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", maxWidth: 500 }}>
          <h3 className="font-medium mb-3">Catat Transaksi Manual</h3>

          <div className="flex gap-2 mb-3">
            <input type="date" value={form.tanggal} onChange={function (e) { setForm({ ...form, tanggal: e.target.value }); }} style={inputStyle} />
            <select value={form.tipe} onChange={function (e) { setForm({ ...form, tipe: e.target.value }); }} style={inputStyle}>
              <option value="keluar">Pengeluaran</option>
              <option value="masuk">Pemasukan Lain</option>
            </select>
          </div>

          <input
            placeholder="Keterangan (misal: Beli kabel fiber 100m)"
            value={form.keterangan}
            onChange={function (e) { setForm({ ...form, keterangan: e.target.value }); }}
            className="w-full mb-3"
            style={inputStyle}
          />

          <div className="flex gap-2 mb-3">
            <input
              placeholder="Kategori (misal: Perangkat, Operasional)"
              value={form.kategori}
              onChange={function (e) { setForm({ ...form, kategori: e.target.value }); }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              placeholder="Nominal"
              type="number"
              value={form.nominal}
              onChange={function (e) { setForm({ ...form, nominal: e.target.value }); }}
              style={{ ...inputStyle, width: 150 }}
            />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSimpan} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: "var(--color-signal-good)" }}>Simpan</button>
            <button onClick={function () { setShowForm(false); }} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)" }}>Batal</button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
                <th className="text-left p-3 text-sm">Tanggal</th>
                <th className="text-left p-3 text-sm">Keterangan</th>
                <th className="text-left p-3 text-sm">Kategori</th>
                <th className="text-right p-3 text-sm">Masuk</th>
                <th className="text-right p-3 text-sm">Keluar</th>
                <th className="text-right p-3 text-sm">Saldo</th>
                <th className="text-left p-3 text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(function (e, i) {
                return (
                  <tr key={i} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="p-3 text-sm">{formatTanggal(e.tanggal)}</td>
                    <td className="p-3 text-sm">{e.keterangan}</td>
                    <td className="p-3 text-sm">{e.kategori}</td>
                    <td className="p-3 text-sm text-right mono" style={{ color: "var(--color-signal-good)" }}>
                      {e.tipe === "masuk" ? formatRupiah(e.nominal) : "-"}
                    </td>
                    <td className="p-3 text-sm text-right mono" style={{ color: "var(--color-signal-bad)" }}>
                      {e.tipe === "keluar" ? formatRupiah(e.nominal) : "-"}
                    </td>
                    <td className="p-3 text-sm text-right mono font-medium">{formatRupiah(e.saldo)}</td>
                    <td className="p-3">
                      {e.sourceType && e.sourceId && (
                        <Link
                          href={"/invoice?tipe=" + e.sourceType + "&id=" + e.sourceId}
                          target="_blank"
                          className="text-xs flex items-center gap-1"
                          style={{ color: "var(--color-accent)" }}
                        >
                          <FileText size={13} /> Invoice
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                    Belum ada transaksi
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