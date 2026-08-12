// app/(dashboard)/jaringan/bandwidth/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface PelangganBandwidth {
  id: string;
  nama: string;
  bandwidth_upload_limit: string;
  bandwidth_download_limit: string;
  log_bandwidth: { upload_bytes: number; download_bytes: number; recorded_at: string }[];
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 MB";
  const mb = bytes / 1024 / 1024;
  return mb > 1024 ? (mb / 1024).toFixed(2) + " GB" : mb.toFixed(1) + " MB";
}

function parseLimitToMbps(limit: string): number {
  if (!limit) return 0;
  const match = limit.match(/(\d+)([MK])?/i);
  if (!match) return 0;
  const value = Number(match[1]);
  return match[2] && match[2].toUpperCase() === "K" ? value / 1000 : value;
}

function estimateUsagePercent(bytes: number, limitMbps: number): number {
  if (!limitMbps) return 0;
  const estimatedMaxBytesPerPeriod = limitMbps * 125000 * 60 * 15;
  const percent = (bytes / estimatedMaxBytesPerPeriod) * 100;
  return Math.min(percent, 100);
}

function SpeedBar({ label, bytes, limit, color }: { label: string; bytes: number; limit: string; color: string }) {
  const percent = estimateUsagePercent(bytes, parseLimitToMbps(limit));
  return (
    <div style={{ minWidth: 140 }}>
      <div className="flex items-center justify-between mb-1" style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>
        <span>{label}</span>
        <span>{formatBytes(bytes)}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "var(--color-bg)", overflow: "hidden" }}>
        <div
          className="speed-bar-fill"
          style={{
            height: "100%",
            width: percent + "%",
            background: color,
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
}

export default function BandwidthPage() {
  const [pelanggan, setPelanggan] = useState<PelangganBandwidth[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [uploadInput, setUploadInput] = useState("");
  const [downloadInput, setDownloadInput] = useState("");

  async function loadData() {
    setLoading(true);
    const result = await supabase
      .from("pelanggan")
      .select(
        "id, nama, bandwidth_upload_limit, bandwidth_download_limit, log_bandwidth(upload_bytes, download_bytes, recorded_at)"
      )
      .not("bandwidth_upload_limit", "is", null)
      .order("recorded_at", { foreignTable: "log_bandwidth", ascending: false })
      .limit(1, { foreignTable: "log_bandwidth" })
      .limit(50);

    setPelanggan(result.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function startEdit(p: PelangganBandwidth) {
    setEditing(p.id);
    setUploadInput(p.bandwidth_upload_limit);
    setDownloadInput(p.bandwidth_download_limit);
  }

  async function saveEdit(pelangganId: string) {
    await fetch("/api/jaringan/set-bandwidth", {
      method: "POST",
      body: JSON.stringify({ pelangganId: pelangganId, uploadLimit: uploadInput, downloadLimit: downloadInput }),
    });
    setEditing(null);
    loadData();
  }

  if (loading) {
    return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;
  }

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 6, padding: "4px 8px", width: 70 };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Manajemen Bandwidth</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        {pelanggan.length} pelanggan dengan queue bandwidth aktif
      </p>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--color-bg)" }}>
              <th className="text-left p-3 text-sm">Pelanggan</th>
              <th className="text-left p-3 text-sm">Limit</th>
              <th className="text-left p-3 text-sm">Usage Upload</th>
              <th className="text-left p-3 text-sm">Usage Download</th>
              <th className="text-left p-3 text-sm">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pelanggan.map(function (p) {
              const log = p.log_bandwidth && p.log_bandwidth[0];
              return (
                <tr key={p.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td className="p-3 text-sm">{p.nama}</td>
                  <td className="p-3 text-sm">
                    {editing === p.id ? (
                      <div className="flex gap-1 items-center">
                        <input value={uploadInput} onChange={function (e) { setUploadInput(e.target.value); }} style={inputStyle} />
                        /
                        <input value={downloadInput} onChange={function (e) { setDownloadInput(e.target.value); }} style={inputStyle} />
                      </div>
                    ) : (
                      p.bandwidth_upload_limit + " / " + p.bandwidth_download_limit
                    )}
                  </td>
                  <td className="p-3">
                    <SpeedBar
                      label="Upload"
                      bytes={log ? log.upload_bytes : 0}
                      limit={p.bandwidth_upload_limit}
                      color="var(--color-accent)"
                    />
                  </td>
                  <td className="p-3">
                    <SpeedBar
                      label="Download"
                      bytes={log ? log.download_bytes : 0}
                      limit={p.bandwidth_download_limit}
                      color="var(--color-signal-good)"
                    />
                  </td>
                  <td className="p-3">
                    {editing === p.id ? (
                      <button
                        onClick={function () { saveEdit(p.id); }}
                        className="px-3 py-1.5 rounded text-sm text-white"
                        style={{ background: "var(--color-signal-good)" }}
                      >
                        Simpan
                      </button>
                    ) : (
                      <button
                        onClick={function () { startEdit(p); }}
                        className="px-3 py-1.5 rounded text-sm"
                        style={{ border: "1px solid var(--color-border)" }}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {pelanggan.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                  Belum ada pelanggan dengan queue bandwidth. Set limit dulu lewat halaman Data Pelanggan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}