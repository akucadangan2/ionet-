"use client";

import { useEffect, useState } from "react";

interface ChartPoint {
  waktu: string;
  downloadMbps: number;
}

interface RekapData {
  avgDownload: number;
  avgUpload: number;
  maxDownload: number;
  maxUpload: number;
  dataPoints: number;
  chartData: ChartPoint[];
}

function BarChart({ data }: { data: ChartPoint[] }) {
  if (!data || data.length === 0) {
    return <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>Belum ada data</p>;
  }

  const maxVal = Math.max(...data.map(function (d) { return d.downloadMbps; }), 1);
  const width = 100 / data.length;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: 100, gap: 2 }}>
      {data.map(function (d, i) {
        const heightPercent = (d.downloadMbps / maxVal) * 100;
        return (
          <div
            key={i}
            title={new Date(d.waktu).toLocaleString("id-ID") + ": " + d.downloadMbps + " Mbps"}
            style={{
              width: width + "%",
              height: Math.max(heightPercent, 2) + "%",
              background: "var(--color-accent)",
              borderRadius: "2px 2px 0 0",
            }}
          />
        );
      })}
    </div>
  );
}

export default function RekapUplinkPage() {
  const [periode, setPeriode] = useState("harian");
  const [rekap, setRekap] = useState<Record<string, RekapData>>({});
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/uplink/rekap?periode=" + periode);
    const json = await res.json();
    setRekap(json.rekap || {});
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, [periode]);

  const periodeLabel: Record<string, string> = { harian: "24 Jam Terakhir", mingguan: "7 Hari Terakhir", bulanan: "30 Hari Terakhir" };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">Rekap Pemakaian Uplink</h1>
        <div className="flex gap-2">
          {["harian", "mingguan", "bulanan"].map(function (p) {
            return (
              <button
                key={p}
                onClick={function () { setPeriode(p); }}
                className="px-3 py-1.5 rounded text-sm"
                style={{
                  border: "1px solid var(--color-border)",
                  background: periode === p ? "var(--color-accent)" : "transparent",
                  color: periode === p ? "white" : "var(--color-ink)",
                }}
              >
                {p === "harian" ? "Harian" : p === "mingguan" ? "Mingguan" : "Bulanan"}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Menampilkan data {periodeLabel[periode]}
      </p>

      {loading ? (
        <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {Object.entries(rekap).map(function ([nama, data]) {
            return (
              <div key={nama} className="rounded-lg p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <h3 className="font-medium mb-3">{nama}</h3>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>Rata-rata Download</p>
                    <p className="text-lg font-semibold mono">{data.avgDownload} Mbps</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>Rata-rata Upload</p>
                    <p className="text-lg font-semibold mono">{data.avgUpload} Mbps</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>Puncak Download</p>
                    <p className="text-sm font-medium mono" style={{ color: "var(--color-signal-warn)" }}>{data.maxDownload} Mbps</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>Puncak Upload</p>
                    <p className="text-sm font-medium mono" style={{ color: "var(--color-signal-warn)" }}>{data.maxUpload} Mbps</p>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
                  <p className="text-xs mb-2" style={{ color: "var(--color-ink-muted)" }}>Grafik Download ({data.dataPoints} data poin)</p>
                  <BarChart data={data.chartData} />
                </div>
              </div>
            );
          })}
          {Object.keys(rekap).length === 0 && (
            <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>Belum ada data rekap</p>
          )}
        </div>
      )}
    </div>
  );
}