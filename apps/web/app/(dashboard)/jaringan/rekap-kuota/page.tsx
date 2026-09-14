"use client";

import { useEffect, useState } from "react";

interface KuotaIsp {
  uplinkId: string;
  nama: string;
  totalDownloadGb: number;
  totalUploadGb: number;
  totalGb: number;
}

interface GrandTotal {
  totalDownloadGb: number;
  totalUploadGb: number;
  totalGb: number;
}

const periodeLabel: Record<string, string> = {
  harian: "Hari Ini",
  mingguan: "7 Hari Terakhir",
  bulanan: "Bulan Ini",
  tahunan: "Tahun Ini",
};

function formatGb(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(2) + " TB";
  return n.toFixed(2) + " GB";
}

export default function RekapKuotaPage() {
  const [periode, setPeriode] = useState("harian");
  const [perIsp, setPerIsp] = useState<KuotaIsp[]>([]);
  const [grandTotal, setGrandTotal] = useState<GrandTotal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/uplink/rekap-kuota?periode=" + periode);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setPerIsp(json.perIsp || []);
      setGrandTotal(json.grandTotal || null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadData();
  }, [periode]);

  const tabStyle = (active: boolean) => ({
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    border: active ? "none" : "1px solid var(--color-border)",
    background: active ? "var(--color-accent)" : "var(--color-surface)",
    color: active ? "white" : "var(--color-ink)",
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Rekap Kuota Internet</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Estimasi pemakaian data per ISP, dihitung dari histori kecepatan yang terekam. Berguna buat mantau sebelum kena FUP.
      </p>

      <div className="flex gap-2 mb-6">
        {Object.keys(periodeLabel).map(function (p) {
          return (
            <button key={p} onClick={function () { setPeriode(p); }} style={tabStyle(periode === p)}>
              {periodeLabel[p]}
            </button>
          );
        })}
      </div>

      {loading && <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>}
      {error && <p style={{ color: "var(--color-signal-bad)" }}>{error}</p>}

      {!loading && !error && (
        <>
          {grandTotal && (
            <div
              className="p-5 rounded-lg mb-6"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              <p className="text-sm mb-1" style={{ opacity: 0.85 }}>Total Semua ISP - {periodeLabel[periode]}</p>
              <p className="text-3xl font-bold">{formatGb(grandTotal.totalGb)}</p>
              <p className="text-xs mt-1" style={{ opacity: 0.85 }}>
                Download {formatGb(grandTotal.totalDownloadGb)} &middot; Upload {formatGb(grandTotal.totalUploadGb)}
              </p>
            </div>
          )}

          <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--color-bg)" }}>
                  <th className="text-left p-3 text-sm">ISP</th>
                  <th className="text-left p-3 text-sm">Download</th>
                  <th className="text-left p-3 text-sm">Upload</th>
                  <th className="text-left p-3 text-sm">Total</th>
                </tr>
              </thead>
              <tbody>
                {perIsp.map(function (r) {
                  return (
                    <tr key={r.uplinkId} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td className="p-3 text-sm font-medium">{r.nama}</td>
                      <td className="p-3 text-sm">{formatGb(r.totalDownloadGb)}</td>
                      <td className="p-3 text-sm">{formatGb(r.totalUploadGb)}</td>
                      <td className="p-3 text-sm font-semibold">{formatGb(r.totalGb)}</td>
                    </tr>
                  );
                })}
                {perIsp.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                      Belum ada data untuk periode ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs mt-4" style={{ color: "var(--color-ink-muted)" }}>
            Catatan: ini estimasi dari sample kecepatan berkala, bukan pengukuran byte-per-byte persis dari ISP. Cocok buat mantau tren, bukan angka final buat komplain ke provider.
          </p>
        </>
      )}
    </div>
  );
}