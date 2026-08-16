"use client";

import { useEffect, useState } from "react";

interface HistoryPoint {
  download_mbps: number;
  upload_mbps: number;
  recorded_at: string;
}

interface UplinkData {
  nama: string;
  kapasitasMbps: number | null;
  status: string;
  downloadMbps: number | null;
  uploadMbps: number | null;
  error: string | null;
  history: HistoryPoint[];
}

function statusColor(status: string, error: string | null) {
  if (error) return "var(--color-signal-bad)";
  if (status === "online") return "var(--color-signal-good)";
  return "var(--color-signal-bad)";
}

function usagePercent(download: number | null, kapasitas: number | null) {
  if (!download || !kapasitas) return 0;
  return Math.min((download / kapasitas) * 100, 100);
}

function MiniChart({ history, kapasitas }: { history: HistoryPoint[]; kapasitas: number | null }) {
  if (!history || history.length < 2) {
    return <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>Belum cukup data histori</p>;
  }

  const maxVal = kapasitas || Math.max(...history.map(function (h) { return h.download_mbps || 0; }), 1);
  const width = 280;
  const height = 60;
  const step = width / (history.length - 1);

  const points = history
    .map(function (h, i) {
      const x = i * step;
      const y = height - (Math.min(h.download_mbps || 0, maxVal) / maxVal) * height;
      return x + "," + y;
    })
    .join(" ");

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth={2} />
    </svg>
  );
}

export default function UplinkMonitoringPage() {
  const [uplinks, setUplinks] = useState<UplinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setError("");
    try {
      const res = await fetch("/api/uplink/traffic");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setUplinks(json.uplinks || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadData();
    const interval = setInterval(loadData, 10000);
    return function () { clearInterval(interval); };
  }, []);

  const onlineCount = uplinks.filter(function (u) { return u.status === "online" && !u.error; }).length;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Monitoring Uplink</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        {onlineCount}/{uplinks.length} jalur online, refresh otomatis tiap 10 detik
      </p>

      {loading && <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>}
      {error && <p style={{ color: "var(--color-signal-bad)" }}>{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {uplinks.map(function (u, i) {
            const percent = usagePercent(u.downloadMbps, u.kapasitasMbps);
            return (
              <div
                key={i}
                className="rounded-lg p-5"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{u.nama}</span>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: statusColor(u.status, u.error) + "22",
                      color: statusColor(u.status, u.error),
                    }}
                  >
                    {u.error ? "Error" : u.status === "online" ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>Download</p>
                    <p className="text-lg font-semibold mono">{u.downloadMbps !== null ? u.downloadMbps + " Mbps" : "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>Upload</p>
                    <p className="text-lg font-semibold mono">{u.uploadMbps !== null ? u.uploadMbps + " Mbps" : "-"}</p>
                  </div>
                </div>

                <div style={{ height: 6, borderRadius: 3, background: "var(--color-bg)", overflow: "hidden", marginBottom: 4 }}>
                  <div
                    style={{
                      height: "100%",
                      width: percent + "%",
                      background: percent > 85 ? "var(--color-signal-warn)" : "var(--color-accent)",
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
                <p className="text-xs mb-3" style={{ color: "var(--color-ink-muted)" }}>
                  {percent.toFixed(0)}% dari {u.kapasitasMbps} Mbps
                </p>

                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
                  <p className="text-xs mb-2" style={{ color: "var(--color-ink-muted)" }}>Histori Download (20 poin terakhir)</p>
                  <MiniChart history={u.history} kapasitas={u.kapasitasMbps} />
                </div>
              </div>
            );
          })}
          {uplinks.length === 0 && (
            <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>Belum ada data uplink</p>
          )}
        </div>
      )}
    </div>
  );
}