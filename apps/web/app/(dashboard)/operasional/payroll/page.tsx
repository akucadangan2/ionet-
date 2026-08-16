"use client";

import { useEffect, useState } from "react";

interface PayrollRecord {
  id: string;
  bulan: number;
  tahun: number;
  gaji_pokok: number;
  jumlah_hadir: number;
  jumlah_alpa: number;
  potongan_alpa: number;
  potongan_kasbon: number;
  total_gaji: number;
  status: string;
  karyawan: { nama: string; jabatan: string } | null;
}

const namaBulan = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function PayrollPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [potonganPerAlpa, setPotonganPerAlpa] = useState("100000");
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/payroll?bulan=" + bulan + "&tahun=" + tahun);
    const json = await res.json();
    setRecords(json.data || []);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, [bulan, tahun]);

  async function handleGenerate() {
    setGenerating(true);
    await fetch("/api/payroll", {
      method: "POST",
      body: JSON.stringify({ bulan, tahun, potonganPerAlpa: parseFloat(potonganPerAlpa) }),
    });
    setGenerating(false);
    loadData();
  }

  async function handleTandaiDibayar(id: string) {
    await fetch("/api/payroll", { method: "PATCH", body: JSON.stringify({ id }) });
    loadData();
  }

  const totalPayroll = records.reduce(function (sum, r) { return sum + r.total_gaji; }, 0);
  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Payroll</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Hitung gaji otomatis berdasarkan absensi dan cicilan kasbon
      </p>

      <div className="p-5 rounded-lg mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Bulan</label>
            <select value={bulan} onChange={function (e) { setBulan(Number(e.target.value)); }} style={inputStyle}>
              {namaBulan.slice(1).map(function (nm, i) {
                return <option key={i + 1} value={i + 1}>{nm}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Tahun</label>
            <input type="number" value={tahun} onChange={function (e) { setTahun(Number(e.target.value)); }} style={{ ...inputStyle, width: 100 }} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Potongan per Hari Alpa</label>
            <input type="number" value={potonganPerAlpa} onChange={function (e) { setPotonganPerAlpa(e.target.value); }} style={{ ...inputStyle, width: 150 }} />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--color-accent)", opacity: generating ? 0.6 : 1 }}
          >
            {generating ? "Menghitung..." : "Generate Payroll " + namaBulan[bulan] + " " + tahun}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>
      ) : (
        <>
          <p className="text-sm mb-3" style={{ color: "var(--color-ink-muted)" }}>
            Total payroll {namaBulan[bulan]} {tahun}: <b style={{ color: "var(--color-ink)" }}>{formatRupiah(totalPayroll)}</b>
          </p>

          <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--color-bg)" }}>
                  <th className="text-left p-3 text-sm">Nama</th>
                  <th className="text-left p-3 text-sm">Gaji Pokok</th>
                  <th className="text-left p-3 text-sm">Hadir</th>
                  <th className="text-left p-3 text-sm">Alpa</th>
                  <th className="text-left p-3 text-sm">Potongan Alpa</th>
                  <th className="text-left p-3 text-sm">Potongan Kasbon</th>
                  <th className="text-left p-3 text-sm">Total Gaji</th>
                  <th className="text-left p-3 text-sm">Status</th>
                  <th className="text-left p-3 text-sm">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {records.map(function (r) {
                  return (
                    <tr key={r.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td className="p-3 text-sm font-medium">{r.karyawan?.nama || "-"}</td>
                      <td className="p-3 text-sm">{formatRupiah(r.gaji_pokok)}</td>
                      <td className="p-3 text-sm">{r.jumlah_hadir}</td>
                      <td className="p-3 text-sm">{r.jumlah_alpa}</td>
                      <td className="p-3 text-sm" style={{ color: "var(--color-signal-bad)" }}>-{formatRupiah(r.potongan_alpa)}</td>
                      <td className="p-3 text-sm" style={{ color: "var(--color-signal-bad)" }}>-{formatRupiah(r.potongan_kasbon)}</td>
                      <td className="p-3 text-sm font-semibold">{formatRupiah(r.total_gaji)}</td>
                      <td className="p-3 text-sm">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ background: r.status === "dibayar" ? "var(--color-signal-good)22" : "var(--color-signal-warn)22", color: r.status === "dibayar" ? "var(--color-signal-good)" : "var(--color-signal-warn)" }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {r.status === "draft" && (
                          <button
                            onClick={function () { handleTandaiDibayar(r.id); }}
                            className="px-2 py-1 rounded text-xs text-white"
                            style={{ background: "var(--color-signal-good)" }}
                          >
                            Tandai Dibayar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                      Belum ada payroll untuk periode ini, klik "Generate Payroll" di atas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}