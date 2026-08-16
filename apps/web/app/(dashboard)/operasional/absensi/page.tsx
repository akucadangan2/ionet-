"use client";

import { useEffect, useState } from "react";

interface AbsensiRecord {
  id: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  latitude_masuk: number | null;
  longitude_masuk: number | null;
  foto_masuk_url: string | null;
  latitude_pulang: number | null;
  longitude_pulang: number | null;
  foto_pulang_url: string | null;
  status: string;
  karyawan: { nama: string; jabatan: string } | null;
}

function formatJam(t: string | null) {
  if (!t) return "-";
  return new Date(t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function AbsensiAdminPage() {
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [selectedFoto, setSelectedFoto] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/absensi?tanggal=" + tanggal);
    const json = await res.json();
    setRecords(json.data || []);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, [tanggal]);

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Rekap Absensi</h1>
        <input
          type="date"
          value={tanggal}
          onChange={function (e) { setTanggal(e.target.value); }}
          style={inputStyle}
        />
      </div>

      {loading ? (
        <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
                <th className="text-left p-3 text-sm">Nama</th>
                <th className="text-left p-3 text-sm">Jabatan</th>
                <th className="text-left p-3 text-sm">Jam Masuk</th>
                <th className="text-left p-3 text-sm">Foto Masuk</th>
                <th className="text-left p-3 text-sm">Jam Pulang</th>
                <th className="text-left p-3 text-sm">Foto Pulang</th>
                <th className="text-left p-3 text-sm">Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {records.map(function (r) {
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="p-3 text-sm font-medium">{r.karyawan?.nama || "-"}</td>
                    <td className="p-3 text-sm capitalize">{r.karyawan?.jabatan || "-"}</td>
                    <td className="p-3 text-sm mono">{formatJam(r.jam_masuk)}</td>
                    <td className="p-3">
                      {r.foto_masuk_url ? (
                        <img
                          src={r.foto_masuk_url}
                          alt="Foto masuk"
                          className="w-10 h-10 rounded-full object-cover cursor-pointer"
                          onClick={function () { setSelectedFoto(r.foto_masuk_url); }}
                        />
                      ) : "-"}
                    </td>
                    <td className="p-3 text-sm mono">{formatJam(r.jam_pulang)}</td>
                    <td className="p-3">
                      {r.foto_pulang_url ? (
                        <img
                          src={r.foto_pulang_url}
                          alt="Foto pulang"
                          className="w-10 h-10 rounded-full object-cover cursor-pointer"
                          onClick={function () { setSelectedFoto(r.foto_pulang_url); }}
                        />
                      ) : "-"}
                    </td>
                    <td className="p-3">
                      {r.latitude_masuk && r.longitude_masuk ? (
                        <a
                          href={"https://www.google.com/maps?q=" + r.latitude_masuk + "," + r.longitude_masuk}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--color-accent)", fontSize: 13 }}
                        >
                          📍 Lihat Peta
                        </a>
                      ) : "-"}
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                    Belum ada absensi di tanggal ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedFoto && (
        <div
          onClick={function () { setSelectedFoto(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, cursor: "pointer" }}
        >
          <img src={selectedFoto} alt="Foto absensi" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}