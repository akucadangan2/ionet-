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
  return mb > 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

export default function BandwidthPage() {
  const [pelanggan, setPelanggan] = useState<PelangganBandwidth[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [uploadInput, setUploadInput] = useState("");
  const [downloadInput, setDownloadInput] = useState("");

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("pelanggan")
      .select(`
        id, nama, bandwidth_upload_limit, bandwidth_download_limit,
        log_bandwidth(upload_bytes, download_bytes, recorded_at)
      `)
      .order("recorded_at", { foreignTable: "log_bandwidth", ascending: false })
      .limit(1, { foreignTable: "log_bandwidth" });

    setPelanggan(data ?? []);
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
      body: JSON.stringify({ pelangganId, uploadLimit: uploadInput, downloadLimit: downloadInput }),
    });
    setEditing(null);
    loadData();
  }

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 6, padding: "4px 8px", width: 70 };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Manajemen Bandwidth</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        {pelanggan.length} pelanggan dengan queue bandwidth aktif
      </p>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table>
          <thead>
            <tr>
              <th>Pelanggan</th>
              <th>Limit Upload</th>
              <th>Limit Download</th>
              <th>Usage Upload</th>
              <th>Usage Download</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pelanggan.map((p) => (
              <tr key={p.id}>
                <td>{p.nama}</td>
                <td className="mono">
                  {editing === p.id ? (
                    <input value={uploadInput} onChange={(e) => setUploadInput(e.target.value)} style={inputStyle} />
                  ) : (
                    p.bandwidth_upload_limit
                  )}
                </td>
                <td className="mono">
                  {editing === p.id ? (
                    <input value={downloadInput} onChange={(e) => setDownloadInput(e.target.value)} style={inputStyle} />
                  ) : (
                    p.bandwidth_download_limit
                  )}
                </td>
                <td className="mono" style={{ color: "var(--color-ink-muted)" }}>
                  {formatBytes(p.log_bandwidth?.[0]?.upload_bytes)}
                </td>
                <td className="mono" style={{ color: "var(--color-ink-muted)" }}>
                  {formatBytes(p.log_bandwidth?.[0]?.download_bytes)}
                </td>
                <td>
                  {editing === p.id ? (
                    <button
                      onClick={() => saveEdit(p.id)}
                      className="px-3 py-1.5 rounded text-sm text-white"
                      style={{ background: "var(--color-signal-good)" }}
                    >
                      Simpan
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(p)}
                      className="px-3 py-1.5 rounded text-sm"
                      style={{ border: "1px solid var(--color-border)" }}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {pelanggan.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8" style={{ color: "var(--color-ink-muted)" }}>
                  Belum ada pelanggan dengan queue bandwidth
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}