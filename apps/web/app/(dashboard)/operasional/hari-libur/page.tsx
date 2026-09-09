"use client";

import { useEffect, useState } from "react";

interface HariLibur {
  id: string;
  tanggal: string;
  keterangan: string | null;
}

export default function HariLiburPage() {
  const [list, setList] = useState<HariLibur[]>([]);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/hari-libur");
    const json = await res.json();
    setList(json.data || []);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, []);

  async function handleTambah() {
    if (!tanggal) {
      alert("Pilih tanggal dulu");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hari-libur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal, keterangan }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.message);
      } else {
        setTanggal("");
        setKeterangan("");
        loadData();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleHapus(id: string) {
    if (!confirm("Yakin hapus hari libur ini?")) return;
    setDeletingId(id);
    try {
      await fetch("/api/hari-libur?id=" + id, { method: "DELETE" });
      loadData();
    } finally {
      setDeletingId(null);
    }
  }

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Hari Libur / Tanggal Merah</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Tanggal di sini otomatis dilewatin dari perhitungan alpa - karyawan nggak kena potongan di hari ini walau nggak absen
      </p>

      <div className="p-5 rounded-lg mb-6 flex gap-2 flex-wrap items-end" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Tanggal</label>
          <input type="date" value={tanggal} onChange={function (e) { setTanggal(e.target.value); }} style={inputStyle} />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Keterangan (opsional)</label>
          <input placeholder="misal: Idul Fitri" value={keterangan} onChange={function (e) { setKeterangan(e.target.value); }} style={{ ...inputStyle, width: 220 }} />
        </div>
        <button
          onClick={handleTambah}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm text-white"
          style={{ background: "var(--color-signal-good)", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Menyimpan..." : "+ Tambah"}
        </button>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--color-bg)" }}>
              <th className="text-left p-3 text-sm">Tanggal</th>
              <th className="text-left p-3 text-sm">Keterangan</th>
              <th className="text-left p-3 text-sm">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map(function (h) {
              return (
                <tr key={h.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td className="p-3 text-sm">
                    {new Date(h.tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </td>
                  <td className="p-3 text-sm" style={{ color: "var(--color-ink-muted)" }}>{h.keterangan || "-"}</td>
                  <td className="p-3">
                    <button
                      onClick={function () { handleHapus(h.id); }}
                      disabled={deletingId === h.id}
                      className="px-2 py-1 rounded text-xs"
                      style={{ border: "1px solid var(--color-signal-bad)", color: "var(--color-signal-bad)", opacity: deletingId === h.id ? 0.6 : 1 }}
                    >
                      {deletingId === h.id ? "..." : "Hapus"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                  Belum ada hari libur ditambahkan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}