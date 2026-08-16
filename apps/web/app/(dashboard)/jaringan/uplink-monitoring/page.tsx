"use client";

import { useEffect, useState } from "react";

interface UplinkData {
  nama: string;
  kapasitasMbps: number | null;
  status: string;
  downloadMbps: number | null;
  uploadMbps: number | null;
  error: string | null;
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
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
                <th className="text-left p-3 text-sm">Jalur</th>
                <th className="text-left p-3 text-sm">Kapasitas</th>
                <th className="text-left p-3 text-sm">Download</th>
                <th className="text-left p-3 text-sm">Upload</th>
                <th className="text-left p-3 text-sm">Pemakaian</th>
                <th className="text-left p-3 text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {uplinks.map(function (u, i) {
                const percent = usagePercent(u.downloadMbps, u.kapasitasMbps);
                return (
                  <tr key={i} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="p-3 text-sm font-medium">{u.nama}</td>
                    <td className="p-3 text-sm">{u.kapasitasMbps ? u.kapasitasMbps + " Mbps" : "-"}</td>
                    <td className="p-3 text-sm mono">{u.downloadMbps !== null ? u.downloadMbps + " Mbps" : "-"}</td>
                    <td className="p-3 text-sm mono">{u.uploadMbps !== null ? u.uploadMbps + " Mbps" : "-"}</td>
                    <td className="p-3" style={{ minWidth: 120 }}>
                      <div style={{ height: 6, borderRadius: 3, background: "var(--color-bg)", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: percent + "%",
                            background: percent > 85 ? "var(--color-signal-warn)" : "var(--color-accent)",
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                      <span className="text-xs" style={{ color: "var(--color-ink-muted)" }}>{percent.toFixed(0)}%</span>
                    </td>
                    <td className="p-3">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          background: statusColor(u.status, u.error) + "22",
                          color: statusColor(u.status, u.error),
                        }}
                      >
                        {u.error ? "Error" : u.status === "online" ? "Online" : "Offline"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {uplinks.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                    Belum ada data uplink
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}