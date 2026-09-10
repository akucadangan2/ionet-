"use client";

import { useEffect, useState } from "react";

interface Slip {
  id: string;
  bulan: number;
  tahun: number;
  namaBulan: string;
  namaKaryawan: string;
  jabatan: string;
  gajiPokok: number;
  hariKerja: number;
  gajiPerHari: number;
  jumlahHadir: number;
  jumlahAlpa: number;
  jumlahIzin: number;
  jumlahCuti: number;
  jumlahSakit: number;
  potonganAlpa: number;
  potonganBpjs: number;
  potonganKasbon: number;
  totalGaji: number;
  dibuatAt: string;
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function CompactSlip({ s }: { s: Slip }) {
  return (
    <div className="slip-quarter">
      <div style={{ textAlign: "center", borderBottom: "1px solid #333", paddingBottom: 3, marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 11 }}>SLIP GAJI</div>
        <div style={{ fontSize: 9 }}>{s.namaBulan} {s.tahun}</div>
      </div>

      <div style={{ fontSize: 9, marginBottom: 3 }}>
        <div><b>{s.namaKaryawan}</b> - {s.jabatan}</div>
        <div>Hari kerja: {s.hariKerja} hr &middot; Gaji/hari: {formatRupiah(s.gajiPerHari)}</div>
      </div>

      <div style={{ fontSize: 8.5, marginBottom: 3, display: "flex", flexWrap: "wrap", gap: 6 }}>
        <span>Hadir: {s.jumlahHadir}</span>
        <span>Alpa: {s.jumlahAlpa}</span>
        <span>Izin: {s.jumlahIzin}</span>
        <span>Cuti: {s.jumlahCuti}</span>
        <span>Sakit: {s.jumlahSakit}</span>
      </div>

      <table style={{ width: "100%", fontSize: 9, borderTop: "1px dashed #999", paddingTop: 3 }}>
        <tbody>
          <tr><td>Gaji Pokok</td><td style={{ textAlign: "right" }}>{formatRupiah(s.gajiPokok)}</td></tr>
          <tr><td>Pot. Alpa/Izin</td><td style={{ textAlign: "right" }}>-{formatRupiah(s.potonganAlpa)}</td></tr>
          <tr><td>Pot. BPJS</td><td style={{ textAlign: "right" }}>-{formatRupiah(s.potonganBpjs)}</td></tr>
          <tr><td>Pot. Kasbon</td><td style={{ textAlign: "right" }}>-{formatRupiah(s.potonganKasbon)}</td></tr>
        </tbody>
      </table>

      <div style={{ borderTop: "1px solid #333", marginTop: 4, paddingTop: 3, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 10 }}>
        <span>TOTAL</span>
        <span>{formatRupiah(s.totalGaji)}</span>
      </div>
    </div>
  );
}

export default function SlipGajiPage() {
  const [list, setList] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Slip | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [printQueue, setPrintQueue] = useState<Slip[]>([]);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/payroll/slip");
    const json = await res.json();
    setList(json.data || []);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, []);

  function toggleSelect(id: string) {
    setSelectedIds(function (prev) {
      if (prev.includes(id)) return prev.filter(function (x) { return x !== id; });
      if (prev.length >= 4) {
        alert("Maksimal 4 slip per halaman cetak");
        return prev;
      }
      return [...prev, id];
    });
  }

  function handleCetakTerpilih() {
    const slips = list.filter(function (s) { return selectedIds.includes(s.id); });
    setPrintQueue(slips);
    setTimeout(function () {
      window.print();
    }, 150);
  }

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  return (
    <div>
      <div className="no-print">
        <h1 className="text-2xl font-semibold mb-1">Slip Gaji</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
          Riwayat gaji yang sudah ditandai dibayar. Centang sampai 4 slip buat dicetak sekaligus dalam 1 lembar A4 (tiap slip selalu 1/4 halaman).
        </p>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>{selectedIds.length}/4 dipilih</p>
          <button
            onClick={handleCetakTerpilih}
            disabled={selectedIds.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--color-signal-good)", opacity: selectedIds.length === 0 ? 0.5 : 1 }}
          >
            Cetak Terpilih ({selectedIds.length})
          </button>
        </div>

        <div className="rounded-lg overflow-hidden mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
                <th className="text-left p-3 text-sm"></th>
                <th className="text-left p-3 text-sm">Nama</th>
                <th className="text-left p-3 text-sm">Periode</th>
                <th className="text-left p-3 text-sm">Total Gaji</th>
                <th className="text-left p-3 text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map(function (s) {
                return (
                  <tr key={s.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="p-3">
                      <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={function () { toggleSelect(s.id); }} />
                    </td>
                    <td className="p-3 text-sm font-medium">{s.namaKaryawan}</td>
                    <td className="p-3 text-sm">{s.namaBulan} {s.tahun}</td>
                    <td className="p-3 text-sm font-semibold">{formatRupiah(s.totalGaji)}</td>
                    <td className="p-3">
                      <button
                        onClick={function () { setSelected(s); }}
                        className="px-3 py-1.5 rounded text-xs"
                        style={{ border: "1px solid var(--color-border)" }}
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                    Belum ada payroll yang ditandai dibayar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="no-print">
          <div className="flex gap-2 mb-4">
            <button
              onClick={function () { setSelected(null); }}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ border: "1px solid var(--color-border)" }}
            >
              Tutup
            </button>
          </div>

          <div className="p-8 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", maxWidth: 500 }}>
            <div className="text-center mb-4" style={{ borderBottom: "2px solid var(--color-ink)", paddingBottom: 10 }}>
              <h2 className="text-lg font-bold">SLIP GAJI</h2>
              <p className="text-sm">{selected.namaBulan} {selected.tahun}</p>
            </div>
            <p className="text-sm mb-1"><b>{selected.namaKaryawan}</b> - {selected.jabatan}</p>
            <p className="text-sm mb-3" style={{ color: "var(--color-ink-muted)" }}>Hari kerja: {selected.hariKerja} hari &middot; Gaji/hari: {formatRupiah(selected.gajiPerHari)}</p>
            <p className="text-xs mb-3" style={{ color: "var(--color-ink-muted)" }}>
              Hadir {selected.jumlahHadir} &middot; Alpa {selected.jumlahAlpa} &middot; Izin {selected.jumlahIzin} &middot; Cuti {selected.jumlahCuti} &middot; Sakit {selected.jumlahSakit} &middot; Terlambat: fitur belum tersedia
            </p>
            <table className="w-full text-sm mb-3">
              <tbody>
                <tr><td className="py-1">Gaji Pokok</td><td className="py-1 text-right">{formatRupiah(selected.gajiPokok)}</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-signal-bad)" }}>Potongan Alpa/Izin</td><td className="py-1 text-right" style={{ color: "var(--color-signal-bad)" }}>-{formatRupiah(selected.potonganAlpa)}</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-signal-bad)" }}>Potongan BPJS</td><td className="py-1 text-right" style={{ color: "var(--color-signal-bad)" }}>-{formatRupiah(selected.potonganBpjs)}</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-signal-bad)" }}>Potongan Kasbon</td><td className="py-1 text-right" style={{ color: "var(--color-signal-bad)" }}>-{formatRupiah(selected.potonganKasbon)}</td></tr>
              </tbody>
            </table>
            <div style={{ borderTop: "2px solid var(--color-ink)", paddingTop: 8 }} className="flex justify-between font-bold">
              <span>TOTAL DITERIMA</span>
              <span>{formatRupiah(selected.totalGaji)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="print-only">
        {printQueue.map(function (s) {
          return <CompactSlip key={s.id} s={s} />;
        })}
      </div>

      <style jsx global>{`
        .print-only { display: none; }

        @page {
          size: A4;
          margin: 6mm;
        }

        @media print {
          .no-print { display: none !important; }
          nav, header, aside { display: none !important; }
          body { background: white !important; }

          .print-only {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 4mm;
            width: 100%;
            height: 283mm;
          }

          .slip-quarter {
            border: 1px dashed #999;
            padding: 4mm;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            color: #000;
          }
        }
      `}</style>
    </div>
  );
}