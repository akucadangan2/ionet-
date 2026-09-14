"use client";

import { useEffect, useState } from "react";

interface AturanJamAbsen {
  id: string;
  scope: string;
  jam_mulai_masuk: string;
  jam_batas_pulang: string;
  berlaku_mulai: string;
  berlaku_sampai: string | null;
}

const scopeLabel: Record<string, string> = { umum: "Umum (semua shift)", pagi: "Shift Pagi", siang: "Shift Siang" };

function hariIni() {
  return new Date().toISOString().slice(0, 10);
}

function tambahHari(tanggal: string, jumlah: number) {
  const d = new Date(tanggal);
  d.setDate(d.getDate() + jumlah);
  return d.toISOString().slice(0, 10);
}

function statusAturan(a: AturanJamAbsen) {
  const today = hariIni();
  if (today < a.berlaku_mulai) return { label: "Akan Datang", bg: "#FDEEDB", color: "#B5730B" };
  if (a.berlaku_sampai && today > a.berlaku_sampai) return { label: "Kedaluwarsa", bg: "var(--color-bg)", color: "var(--color-ink-muted)" };
  return { label: "Aktif", bg: "#DCF5E4", color: "#1D8348" };
}

function formatTanggal(t: string) {
  return new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function JamKerjaPage() {
  const [list, setList] = useState<AturanJamAbsen[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [scope, setScope] = useState("umum");
  const [jamMulaiMasuk, setJamMulaiMasuk] = useState("07:00");
  const [jamBatasPulang, setJamBatasPulang] = useState("22:00");
  const [berlakuMulai, setBerlakuMulai] = useState(hariIni());
  const [durasi, setDurasi] = useState("seterusnya");
  const [berlakuSampaiCustom, setBerlakuSampaiCustom] = useState("");

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/pengaturan-jam-absen");
    const json = await res.json();
    setList(json.data || []);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, []);

  function hitungBerlakuSampai(): string | null {
    if (durasi === "1hari") return berlakuMulai;
    if (durasi === "1minggu") return tambahHari(berlakuMulai, 6);
    if (durasi === "custom") return berlakuSampaiCustom || null;
    return null; // seterusnya
  }

  async function handleTambah() {
    setSaving(true);
    try {
      const res = await fetch("/api/pengaturan-jam-absen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          jamMulaiMasuk,
          jamBatasPulang,
          berlakuMulai,
          berlakuSampai: hitungBerlakuSampai(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.message);
        return;
      }
      setDurasi("seterusnya");
      setBerlakuSampaiCustom("");
      loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleHapus(id: string) {
    if (!confirm("Yakin hapus aturan ini?")) return;
    setDeletingId(id);
    try {
      await fetch("/api/pengaturan-jam-absen?id=" + id, { method: "DELETE" });
      loadData();
    } finally {
      setDeletingId(null);
    }
  }

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Pengaturan Jam Absen</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Khusus Super Admin - atur jam berapa absen masuk baru bisa dilakukan, dan batas jam absen pulang. Kalau nggak ada aturan aktif, karyawan tetap bebas absen kapan saja.
      </p>

      <div className="p-5 rounded-lg mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", maxWidth: 560 }}>
        <h3 className="font-medium mb-3">Tambah Aturan Baru</h3>

        <div className="mb-3">
          <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Cakupan</label>
          <select value={scope} onChange={function (e) { setScope(e.target.value); }} style={{ ...inputStyle, width: "100%" }}>
            <option value="umum">Umum (berlaku sama untuk semua shift)</option>
            <option value="pagi">Shift Pagi saja</option>
            <option value="siang">Shift Siang saja</option>
          </select>
        </div>

        <div className="flex gap-2 mb-3">
          <div style={{ flex: 1 }}>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Absen Masuk Mulai Jam</label>
            <input type="time" value={jamMulaiMasuk} onChange={function (e) { setJamMulaiMasuk(e.target.value); }} style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Batas Absen Pulang Jam</label>
            <input type="time" value={jamBatasPulang} onChange={function (e) { setJamBatasPulang(e.target.value); }} style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Berlaku Mulai Tanggal</label>
          <input type="date" value={berlakuMulai} onChange={function (e) { setBerlakuMulai(e.target.value); }} style={inputStyle} />
        </div>

        <div className="mb-3">
          <label className="text-xs block mb-2" style={{ color: "var(--color-ink-muted)" }}>Berlaku Sampai</label>
          <div className="flex gap-2 flex-wrap mb-2">
            {[
              { key: "1hari", label: "1 Hari" },
              { key: "1minggu", label: "1 Minggu" },
              { key: "custom", label: "Tanggal Tertentu" },
              { key: "seterusnya", label: "Seterusnya" },
            ].map(function (opt) {
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={function () { setDurasi(opt.key); }}
                  className="px-3 py-1.5 rounded text-xs"
                  style={{
                    border: "1px solid var(--color-border)",
                    background: durasi === opt.key ? "var(--color-accent)" : "var(--color-surface)",
                    color: durasi === opt.key ? "white" : "var(--color-ink)",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {durasi === "custom" && (
            <input type="date" value={berlakuSampaiCustom} onChange={function (e) { setBerlakuSampaiCustom(e.target.value); }} style={inputStyle} />
          )}
        </div>

        <button
          onClick={handleTambah}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm text-white"
          style={{ background: "var(--color-signal-good)", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Menyimpan..." : "+ Tambah Aturan"}
        </button>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--color-bg)" }}>
              <th className="text-left p-3 text-sm">Cakupan</th>
              <th className="text-left p-3 text-sm">Absen Masuk Mulai</th>
              <th className="text-left p-3 text-sm">Batas Absen Pulang</th>
              <th className="text-left p-3 text-sm">Berlaku</th>
              <th className="text-left p-3 text-sm">Status</th>
              <th className="text-left p-3 text-sm">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map(function (a) {
              const st = statusAturan(a);
              return (
                <tr key={a.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td className="p-3 text-sm font-medium">{scopeLabel[a.scope] || a.scope}</td>
                  <td className="p-3 text-sm">{a.jam_mulai_masuk.slice(0, 5)}</td>
                  <td className="p-3 text-sm">{a.jam_batas_pulang.slice(0, 5)}</td>
                  <td className="p-3 text-sm">
                    {formatTanggal(a.berlaku_mulai)} {a.berlaku_sampai ? "- " + formatTanggal(a.berlaku_sampai) : "- Seterusnya"}
                  </td>
                  <td className="p-3 text-sm">
                    <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={function () { handleHapus(a.id); }}
                      disabled={deletingId === a.id}
                      className="px-2 py-1 rounded text-xs"
                      style={{ border: "1px solid var(--color-signal-bad)", color: "var(--color-signal-bad)", opacity: deletingId === a.id ? 0.6 : 1 }}
                    >
                      {deletingId === a.id ? "..." : "Hapus"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                  Belum ada aturan jam absen. Karyawan bebas absen kapan saja sampai ada aturan ditambahkan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}