"use client";

import { useEffect, useState } from "react";

interface Karyawan {
  id: string;
  nama: string;
  jabatan: string;
  no_hp: string | null;
  gaji_pokok: number;
  status: string;
}

const emptyForm = { nama: "", jabatan: "teknisi", no_hp: "", gaji_pokok: "", status: "aktif" };

export default function KaryawanPage() {
  const [list, setList] = useState<Karyawan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/karyawan");
    const json = await res.json();
    setList(json.data || []);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, []);

  function openTambah() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(k: Karyawan) {
    setForm({
      nama: k.nama,
      jabatan: k.jabatan,
      no_hp: k.no_hp || "",
      gaji_pokok: k.gaji_pokok.toString(),
      status: k.status,
    });
    setEditingId(k.id);
    setShowForm(true);
  }

  async function handleSimpan() {
    await fetch("/api/karyawan", {
      method: "POST",
      body: JSON.stringify({
        id: editingId || undefined,
        nama: form.nama,
        jabatan: form.jabatan,
        no_hp: form.no_hp,
        gaji_pokok: parseFloat(form.gaji_pokok) || 0,
        status: form.status,
      }),
    });
    setShowForm(false);
    loadData();
  }

  async function handleHapus(id: string) {
    if (!confirm("Yakin hapus karyawan ini?")) return;
    await fetch("/api/karyawan", { method: "DELETE", body: JSON.stringify({ id }) });
    loadData();
  }

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Data Karyawan</h1>
        <button onClick={openTambah} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--color-accent)" }}>
          + Tambah Karyawan
        </button>
      </div>

      {showForm && (
        <div className="p-5 rounded-lg mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", maxWidth: 500 }}>
          <h3 className="font-medium mb-3">{editingId ? "Edit Karyawan" : "Tambah Karyawan"}</h3>

          <input
            placeholder="Nama Lengkap"
            value={form.nama}
            onChange={function (e) { setForm({ ...form, nama: e.target.value }); }}
            className="w-full mb-3"
            style={inputStyle}
          />

          <div className="flex gap-2 mb-3">
            <select value={form.jabatan} onChange={function (e) { setForm({ ...form, jabatan: e.target.value }); }} style={{ ...inputStyle, flex: 1 }}>
              <option value="teknisi">Teknisi</option>
              <option value="marketing">Marketing</option>
              <option value="admin">Admin</option>
              <option value="lainnya">Lainnya</option>
            </select>
            <select value={form.status} onChange={function (e) { setForm({ ...form, status: e.target.value }); }} style={{ ...inputStyle, flex: 1 }}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              placeholder="No HP"
              value={form.no_hp}
              onChange={function (e) { setForm({ ...form, no_hp: e.target.value }); }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              placeholder="Gaji Pokok"
              type="number"
              value={form.gaji_pokok}
              onChange={function (e) { setForm({ ...form, gaji_pokok: e.target.value }); }}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>

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
              <th className="text-left p-3 text-sm">Nama</th>
              <th className="text-left p-3 text-sm">Jabatan</th>
              <th className="text-left p-3 text-sm">No HP</th>
              <th className="text-left p-3 text-sm">Gaji Pokok</th>
              <th className="text-left p-3 text-sm">Status</th>
              <th className="text-left p-3 text-sm">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map(function (k) {
              return (
                <tr key={k.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td className="p-3 text-sm">{k.nama}</td>
                  <td className="p-3 text-sm capitalize">{k.jabatan}</td>
                  <td className="p-3 text-sm">{k.no_hp || "-"}</td>
                  <td className="p-3 text-sm">Rp {k.gaji_pokok.toLocaleString("id-ID")}</td>
                  <td className="p-3 text-sm">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ background: k.status === "aktif" ? "var(--color-signal-good)22" : "var(--color-ink-muted)22", color: k.status === "aktif" ? "var(--color-signal-good)" : "var(--color-ink-muted)" }}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={function () { openEdit(k); }} className="px-2 py-1 rounded text-sm mr-1" style={{ border: "1px solid var(--color-border)" }}>Edit</button>
                    <button onClick={function () { handleHapus(k.id); }} className="px-2 py-1 rounded text-sm" style={{ border: "1px solid var(--color-signal-bad)", color: "var(--color-signal-bad)" }}>Hapus</button>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                  Belum ada data karyawan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}