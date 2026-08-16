"use client";

import { useEffect, useState } from "react";

interface KomisiRecord {
  id: string;
  jenis: string;
  nilai_dasar: number;
  persentase: number;
  jumlah_komisi: number;
  status: string;
  tanggal: string;
  keterangan: string | null;
  karyawan: { nama: string; jabatan: string } | null;
  pelanggan: { nama: string } | null;
}

interface Karyawan {
  id: string;
  nama: string;
  jabatan: string;
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function KomisiPage() {
  const [records, setRecords] = useState<KomisiRecord[]>([]);
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ karyawanId: "", jenis: "pemasangan", nilaiDasar: "", persentase: "", keterangan: "" });

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/komisi");
    const json = await res.json();
    setRecords(json.data || []);
    setLoading(false);
  }

  async function loadKaryawan() {
    const res = await fetch("/api/karyawan");
    const json = await res.json();
    setKaryawanList((json.data || []).filter(function (k: any) { return k.status === "aktif"; }));
  }

  useEffect(function () {
    loadData();
    loadKaryawan();
  }, []);

  async function handleSimpan() {
    await fetch("/api/komisi", {
      method: "POST",
      body: JSON.stringify({
        karyawanId: form.karyawanId,
        jenis: form.jenis,
        nilaiDasar: parseFloat(form.nilaiDasar),
        persentase: parseFloat(form.persentase),
        keterangan: form.keterangan,
      }),
    });
    setShowForm(false);
    setForm({ karyawanId: "", jenis: "pemasangan", nilaiDasar: "", persentase: "", keterangan: "" });
    loadData();
  }

  async function handleTandaiDibayar(id: string) {
    await fetch("/api/komisi", { method: "PATCH", body: JSON.stringify({ id }) });
    loadData();
  }

  const totalPending = records.filter(function (r) { return r.status === "pending"; }).reduce(function (sum, r) { return sum + r.jumlah_komisi; }, 0);
  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">Manajemen Komisi</h1>
        <button onClick={function () { setShowForm(true); }} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--color-accent)" }}>
          + Catat Komisi
        </button>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Total komisi belum dibayar: <b style={{ color: "var(--color-ink)" }}>{formatRupiah(totalPending)}</b>
      </p>

      {showForm && (
        <div className="p-5 rounded-lg mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", maxWidth: 500 }}>
          <h3 className="font-medium mb-3">Catat Komisi Baru</h3>

          <select
            value={form.karyawanId}
            onChange={function (e) { setForm({ ...form, karyawanId: e.target.value }); }}
            className="w-full mb-3"
            style={inputStyle}
          >
            <option value="">- Pilih Karyawan -</option>
            {karyawanList.map(function (k) {
              return <option key={k.id} value={k.id}>{k.nama} ({k.jabatan})</option>;
            })}
          </select>

          <select
            value={form.jenis}
            onChange={function (e) { setForm({ ...form, jenis: e.target.value }); }}
            className="w-full mb-3"
            style={inputStyle}
          >
            <option value="pemasangan">Bonus Pemasangan (Teknisi)</option>
            <option value="marketing">Bonus Marketing</option>
          </select>

          <div className="flex gap-2 mb-3">
            <input
              placeholder="Nilai Dasar (misal: biaya instalasi)"
              type="number"
              value={form.nilaiDasar}
              onChange={function (e) { setForm({ ...form, nilaiDasar: e.target.value }); }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              placeholder="Persentase (%)"
              type="number"
              value={form.persentase}
              onChange={function (e) { setForm({ ...form, persentase: e.target.value }); }}
              style={{ ...inputStyle, width: 130 }}
            />
          </div>

          {form.nilaiDasar && form.persentase && (
            <p className="text-sm mb-3" style={{ color: "var(--color-signal-good)" }}>
              Komisi: {formatRupiah((parseFloat(form.nilaiDasar) * parseFloat(form.persentase)) / 100)}
            </p>
          )}

          <input
            placeholder="Keterangan (misal: nama pelanggan)"
            value={form.keterangan}
            onChange={function (e) { setForm({ ...form, keterangan: e.target.value }); }}
            className="w-full mb-3"
            style={inputStyle}
          />

          <div className="flex gap-2">
            <button onClick={handleSimpan} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: "var(--color-signal-good)" }}>Simpan</button>
            <button onClick={function () { setShowForm(false); }} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)" }}>Batal</button>
          </div>
        </div>
      )}

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--color-bg)" }}>
              <th className="text-left p-3 text-sm">Karyawan</th>
              <th className="text-left p-3 text-sm">Jenis</th>
              <th className="text-left p-3 text-sm">Keterangan</th>
              <th className="text-left p-3 text-sm">Nilai Dasar</th>
              <th className="text-left p-3 text-sm">%</th>
              <th className="text-left p-3 text-sm">Komisi</th>
              <th className="text-left p-3 text-sm">Status</th>
              <th className="text-left p-3 text-sm">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {records.map(function (r) {
              return (
                <tr key={r.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td className="p-3 text-sm font-medium">{r.karyawan?.nama || "-"}</td>
                  <td className="p-3 text-sm capitalize">{r.jenis}</td>
                  <td className="p-3 text-sm" style={{ color: "var(--color-ink-muted)" }}>{r.keterangan || "-"}</td>
                  <td className="p-3 text-sm">{formatRupiah(r.nilai_dasar)}</td>
                  <td className="p-3 text-sm">{r.persentase}%</td>
                  <td className="p-3 text-sm font-semibold">{formatRupiah(r.jumlah_komisi)}</td>
                  <td className="p-3 text-sm">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ background: r.status === "dibayar" ? "var(--color-signal-good)22" : "var(--color-signal-warn)22", color: r.status === "dibayar" ? "var(--color-signal-good)" : "var(--color-signal-warn)" }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {r.status === "pending" && (
                      <button onClick={function () { handleTandaiDibayar(r.id); }} className="px-2 py-1 rounded text-xs text-white" style={{ background: "var(--color-signal-good)" }}>
                        Tandai Dibayar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                  Belum ada catatan komisi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}