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

export default function SlipGajiPage() {
  const [list, setList] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Slip | null>(null);

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

  function handlePrint() {
    window.print();
  }

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  return (
    <div>
      <div className="no-print">
        <h1 className="text-2xl font-semibold mb-1">Slip Gaji</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
          Riwayat gaji yang sudah ditandai dibayar. Klik "Lihat" untuk buka slip dan cetak.
        </p>

        <div className="rounded-lg overflow-hidden mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
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
                    <td className="p-3 text-sm font-medium">{s.namaKaryawan}</td>
                    <td className="p-3 text-sm">{s.namaBulan} {s.tahun}</td>
                    <td className="p-3 text-sm font-semibold">{formatRupiah(s.totalGaji)}</td>
                    <td className="p-3">
                      <button
                        onClick={function () { setSelected(s); }}
                        className="px-3 py-1.5 rounded text-xs text-white"
                        style={{ background: "var(--color-accent)" }}
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                    Belum ada payroll yang ditandai dibayar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div>
          <div className="no-print flex gap-2 mb-4">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "var(--color-signal-good)" }}
            >
              Cetak / Print
            </button>
            <button
              onClick={function () { setSelected(null); }}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ border: "1px solid var(--color-border)" }}
            >
              Tutup
            </button>
          </div>

          <div
            className="slip-print-area p-8 rounded-lg"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", maxWidth: 600 }}
          >
            <div className="text-center mb-6" style={{ borderBottom: "2px solid var(--color-ink)", paddingBottom: 12 }}>
              <h2 className="text-lg font-bold">SLIP GAJI</h2>
              <p className="text-sm">{selected.namaBulan} {selected.tahun}</p>
            </div>

            <table className="w-full text-sm mb-4">
              <tbody>
                <tr><td className="py-1" style={{ color: "var(--color-ink-muted)" }}>Nama</td><td className="py-1 font-medium">{selected.namaKaryawan}</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-ink-muted)" }}>Jabatan</td><td className="py-1 font-medium capitalize">{selected.jabatan}</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-ink-muted)" }}>Hari Kerja Bulan Ini</td><td className="py-1 font-medium">{selected.hariKerja} hari</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-ink-muted)" }}>Gaji per Hari</td><td className="py-1 font-medium">{formatRupiah(selected.gajiPerHari)}</td></tr>
              </tbody>
            </table>

            <p className="text-xs font-semibold mb-2" style={{ borderTop: "1px solid var(--color-border)", paddingTop: 8 }}>
              REKAP KEHADIRAN
            </p>
            <table className="w-full text-sm mb-4">
              <tbody>
                <tr><td className="py-1" style={{ color: "var(--color-ink-muted)" }}>Hadir</td><td className="py-1 font-medium">{selected.jumlahHadir} hari</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-ink-muted)" }}>Terlambat</td><td className="py-1 font-medium" style={{ color: "var(--color-ink-muted)" }}>Fitur belum tersedia</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-ink-muted)" }}>Alpa</td><td className="py-1 font-medium">{selected.jumlahAlpa} hari</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-ink-muted)" }}>Izin</td><td className="py-1 font-medium">{selected.jumlahIzin} hari</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-ink-muted)" }}>Cuti</td><td className="py-1 font-medium">{selected.jumlahCuti} hari</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-ink-muted)" }}>Sakit</td><td className="py-1 font-medium">{selected.jumlahSakit} hari</td></tr>
              </tbody>
            </table>

            <p className="text-xs font-semibold mb-2" style={{ borderTop: "1px solid var(--color-border)", paddingTop: 8 }}>
              RINCIAN GAJI
            </p>
            <table className="w-full text-sm mb-4">
              <tbody>
                <tr><td className="py-1" style={{ color: "var(--color-ink-muted)" }}>Gaji Pokok</td><td className="py-1 font-medium text-right">{formatRupiah(selected.gajiPokok)}</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-signal-bad)" }}>Potongan Alpa/Izin</td><td className="py-1 font-medium text-right" style={{ color: "var(--color-signal-bad)" }}>-{formatRupiah(selected.potonganAlpa)}</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-signal-bad)" }}>Potongan BPJS</td><td className="py-1 font-medium text-right" style={{ color: "var(--color-signal-bad)" }}>-{formatRupiah(selected.potonganBpjs)}</td></tr>
                <tr><td className="py-1" style={{ color: "var(--color-signal-bad)" }}>Potongan Kasbon</td><td className="py-1 font-medium text-right" style={{ color: "var(--color-signal-bad)" }}>-{formatRupiah(selected.potonganKasbon)}</td></tr>
              </tbody>
            </table>

            <div style={{ borderTop: "2px solid var(--color-ink)", paddingTop: 10 }} className="flex justify-between items-center">
              <span className="font-bold">TOTAL DITERIMA</span>
              <span className="font-bold text-lg">{formatRupiah(selected.totalGaji)}</span>
            </div>

            <p className="text-xs mt-6" style={{ color: "var(--color-ink-muted)" }}>
              Dicetak {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          nav, header, aside { display: none !important; }
          body { background: white !important; }
          .slip-print-area {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}