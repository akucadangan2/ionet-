"use client";

import { useEffect, useState } from "react";

interface Karyawan {
  id: string;
  nama: string;
}

interface AbsensiRow {
  id: string;
  karyawan_id: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: string;
  karyawan: { nama: string; jabatan: string } | null;
}

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  hadir: { bg: "#DCF5E4", color: "#1D8348", label: "Hadir" },
  alpa: { bg: "#FBE2E2", color: "#C0392B", label: "Alpa" },
  izin: { bg: "#FDEEDB", color: "#B5730B", label: "Izin" },
  cuti: { bg: "#DDEBFF", color: "#1D5FBF", label: "Cuti" },
};

function formatJam(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function KoreksiAbsensiPage() {
  const [tanggal, setTanggal] = useState(function () {
    const kemarin = new Date();
    kemarin.setDate(kemarin.getDate() - 1);
    return kemarin.toISOString().slice(0, 10);
  });
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [absensiList, setAbsensiList] = useState<AbsensiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);

    const [karyawanRes, absensiRes] = await Promise.all([
      fetch("/api/karyawan").then(function (r) { return r.json(); }),
      fetch("/api/absensi?tanggal=" + tanggal).then(function (r) { return r.json(); }),
    ]);

    setKaryawanList((karyawanRes.data || []).filter(function (k: any) { return k.status === "aktif"; }));
    setAbsensiList(absensiRes.data || []);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, [tanggal]);

  async function handleUbahStatus(karyawanId: string, newStatus: string) {
    setSavingId(karyawanId);
    try {
      await fetch("/api/absensi/koreksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ karyawanId, tanggal, status: newStatus }),
      });
      loadData();
    } finally {
      setSavingId(null);
    }
  }

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  const absensiByKaryawan: Record<string, AbsensiRow> = {};
  absensiList.forEach(function (a) {
    absensiByKaryawan[a.karyawan_id] = a;
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Koreksi Absensi</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Khusus Super Admin - ubah status Hadir/Alpa/Izin/Cuti per karyawan per hari. Alpa dan Izin sama-sama kepotong gaji, Cuti tidak.
      </p>

      <div className="mb-6">
        <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Tanggal</label>
        <input type="date" value={tanggal} onChange={function (e) { setTanggal(e.target.value); }} style={inputStyle} />
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--color-bg)" }}>
              <th className="text-left p-3 text-sm">Nama</th>
              <th className="text-left p-3 text-sm">Jam Masuk</th>
              <th className="text-left p-3 text-sm">Jam Pulang</th>
              <th className="text-left p-3 text-sm">Status</th>
              <th className="text-left p-3 text-sm">Ubah Jadi</th>
            </tr>
          </thead>
          <tbody>
            {karyawanList.map(function (k) {
              const row = absensiByKaryawan[k.id];
              const status = row?.status || "belum diproses";
              const style = statusStyle[status];
              return (
                <tr key={k.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td className="p-3 text-sm font-medium">{k.nama}</td>
                  <td className="p-3 text-sm">{formatJam(row?.jam_masuk || null)}</td>
                  <td className="p-3 text-sm">{formatJam(row?.jam_pulang || null)}</td>
                  <td className="p-3 text-sm">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ background: style?.bg || "var(--color-bg)", color: style?.color || "var(--color-ink-muted)" }}
                    >
                      {style?.label || status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {["hadir", "izin", "cuti", "alpa"].map(function (s) {
                        return (
                          <button
                            key={s}
                            onClick={function () { handleUbahStatus(k.id, s); }}
                            disabled={savingId === k.id || row?.status === s}
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              border: "1px solid var(--color-border)",
                              opacity: savingId === k.id ? 0.5 : row?.status === s ? 0.4 : 1,
                              cursor: row?.status === s ? "default" : "pointer",
                            }}
                          >
                            {statusStyle[s].label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
            {karyawanList.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                  Belum ada karyawan aktif
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}