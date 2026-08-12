"use client";

import { useState } from "react";

interface ParsedRow {
  nama: string;
  lat: number;
  lng: number;
}

export default function ImportLokasiPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [parseError, setParseError] = useState("");

  function parseKml(kmlText: string): ParsedRow[] {
    const parser = new DOMParser();
    const xml = parser.parseFromString(kmlText, "text/xml");
    const placemarks = xml.getElementsByTagName("Placemark");
    const parsed: ParsedRow[] = [];

    for (let i = 0; i < placemarks.length; i++) {
      const pm = placemarks[i];
      const nameEl = pm.getElementsByTagName("name")[0];
      const coordEl = pm.getElementsByTagName("coordinates")[0];

      if (!nameEl || !coordEl) continue;

      const nama = nameEl.textContent ? nameEl.textContent.trim() : "";
      const coordText = coordEl.textContent ? coordEl.textContent.trim() : "";
      const parts = coordText.split(",");

      if (parts.length < 2 || !nama) continue;

      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);

      if (isNaN(lat) || isNaN(lng)) continue;

      parsed.push({ nama: nama, lat: lat, lng: lng });
    }
    return parsed;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    setFileName(file.name);
    setParseError("");
    setResult(null);

    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target ? String(event.target.result) : "";
      try {
        const parsed = parseKml(text);
        if (parsed.length === 0) {
          setParseError("Tidak ada titik lokasi yang terbaca dari file ini. Pastikan file dalam format KML (bukan KMZ).");
        }
        setRows(parsed);
      } catch (err) {
        setParseError("Gagal membaca file: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/pelanggan/import-lokasi", {
      method: "POST",
      body: JSON.stringify({ rows: rows }),
    });
    const json = await res.json();
    setResult(json);
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Import Lokasi Pelanggan</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Upload file KML dari Google Earth untuk isi koordinat GPS pelanggan sekaligus
      </p>

      <div className="rounded-lg p-6 mb-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <label className="block text-sm font-medium mb-2">Upload File KML</label>
        <p className="text-xs mb-3" style={{ color: "var(--color-ink-muted)" }}>
          Di Google Earth Pro: klik kanan folder/tempat &rarr; Simpan Tempat Sebagai &rarr; pilih format <b>KML</b> (bukan KMZ)
        </p>
        <input type="file" accept=".kml" onChange={handleFileUpload} className="mb-3" />

        {fileName && !parseError && (
          <p className="text-sm mb-3" style={{ color: "var(--color-signal-good)" }}>
            {fileName} terbaca, {rows.length} titik lokasi ditemukan
          </p>
        )}

        {parseError && (
          <p className="text-sm mb-3" style={{ color: "var(--color-signal-bad)" }}>
            {parseError}
          </p>
        )}

        {rows.length > 0 && (
          <div className="mb-4 max-h-40 overflow-y-auto text-xs" style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: 8 }}>
            {rows.slice(0, 10).map(function (r, i) {
              return (
                <div key={i} style={{ color: "var(--color-ink-muted)" }}>
                  {r.nama} &mdash; {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                </div>
              );
            })}
            {rows.length > 10 && (
              <div style={{ color: "var(--color-ink-muted)" }}>...dan {rows.length - 10} lainnya</div>
            )}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={rows.length === 0 || loading}
          className="px-5 py-2 rounded-lg text-sm text-white"
          style={{ background: "var(--color-accent)", opacity: rows.length === 0 || loading ? 0.5 : 1 }}
        >
          {loading ? "Memproses..." : "Import " + rows.length + " Lokasi"}
        </button>
      </div>

      {result && (
        <div className="rounded-lg p-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-sm font-medium mb-2">
            {result.matched} dari {result.total} berhasil dicocokkan
          </p>
          {result.unmatched && result.unmatched.length > 0 && (
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--color-ink-muted)" }}>
                Tidak ditemukan pasangannya di database:
              </p>
              <p className="text-xs" style={{ color: "var(--color-signal-bad)" }}>
                {result.unmatched.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}