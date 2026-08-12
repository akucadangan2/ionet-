"use client";

import { useState } from "react";

interface ParsedRow {
  nama: string;
  lat: number;
  lng: number;
  kategori?: string;
  deskripsi?: string;
}

export default function ImportLokasiPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [parseError, setParseError] = useState("");

  function extractStyleColors(xml: Document): Record<string, string> {
    const styles = xml.getElementsByTagName("Style");
    const colorMap: Record<string, string> = {};

    for (let i = 0; i < styles.length; i++) {
      const style = styles[i];
      const styleId = style.getAttribute("id");
      if (!styleId) continue;

      const colorEl = style.getElementsByTagName("color")[0];
      const iconStyle = style.getElementsByTagName("IconStyle")[0];
      const iconColorEl = iconStyle ? iconStyle.getElementsByTagName("color")[0] : null;

      const kmlColor = (iconColorEl || colorEl) ? (iconColorEl || colorEl)!.textContent : null;
      if (kmlColor) {
        colorMap[styleId] = kmlColorToLabel(kmlColor.trim());
      }
    }
    return colorMap;
  }

  function kmlColorToLabel(kmlColor: string): string {
    if (kmlColor.length < 8) return "Tidak diketahui";
    const b = kmlColor.substring(2, 4);
    const g = kmlColor.substring(4, 6);
    const r = kmlColor.substring(6, 8);
    const rn = parseInt(r, 16);
    const gn = parseInt(g, 16);
    const bn = parseInt(b, 16);

    if (rn > 180 && gn < 100 && bn < 100) return "Merah (Minta Cabut)";
    if (rn > 180 && gn > 180 && bn < 100) return "Kuning (Aktif + Reseller Voucher)";
    if (gn > 130 && rn < 130 && bn < 130) return "Hijau (Aktif Bulanan/PPPoE)";
    if (bn > 150 && rn < 130 && gn < 150) return "Biru (Titik Modem Hotspot)";
    if (Math.abs(rn - gn) < 20 && Math.abs(gn - bn) < 20) return "Abu-abu (Tidak Aktif)";
    return "Tidak diketahui";
  }

  function parseKml(kmlText: string): ParsedRow[] {
    const parser = new DOMParser();
    const xml = parser.parseFromString(kmlText, "text/xml");
    const styleColorMap = extractStyleColors(xml);
    const placemarks = xml.getElementsByTagName("Placemark");
    const parsed: ParsedRow[] = [];

    for (let i = 0; i < placemarks.length; i++) {
      const pm = placemarks[i];
      const nameEl = pm.getElementsByTagName("name")[0];
      const coordEl = pm.getElementsByTagName("coordinates")[0];
      const descEl = pm.getElementsByTagName("description")[0];
      const styleUrlEl = pm.getElementsByTagName("styleUrl")[0];

      if (!nameEl || !coordEl) continue;

      const nama = nameEl.textContent ? nameEl.textContent.trim() : "";
      const coordText = coordEl.textContent ? coordEl.textContent.trim() : "";
      const parts = coordText.split(",");

      if (parts.length < 2 || !nama) continue;

      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);

      if (isNaN(lat) || isNaN(lng)) continue;

      const deskripsi = descEl && descEl.textContent ? descEl.textContent.trim() : "";
      const styleId = styleUrlEl && styleUrlEl.textContent ? styleUrlEl.textContent.replace("#", "").trim() : "";
      const kategori = styleColorMap[styleId] || "Tidak diketahui";

      parsed.push({ nama: nama, lat: lat, lng: lng, kategori: kategori, deskripsi: deskripsi });
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

  async function handleImport(createMissingHotspot: boolean) {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/pelanggan/import-lokasi", {
      method: "POST",
      body: JSON.stringify({ rows: rows, createMissingHotspot: createMissingHotspot }),
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
                  {r.nama} &mdash; {r.lat.toFixed(5)}, {r.lng.toFixed(5)} {r.kategori && r.kategori !== "Tidak diketahui" && `(${r.kategori})`}
                </div>
              );
            })}
            {rows.length > 10 && (
              <div style={{ color: "var(--color-ink-muted)" }}>...dan {rows.length - 10} lainnya</div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={function () { handleImport(false); }}
            disabled={rows.length === 0 || loading}
            className="px-5 py-2 rounded-lg text-sm text-white"
            style={{ background: "var(--color-accent)", opacity: rows.length === 0 || loading ? 0.5 : 1 }}
          >
            {loading ? "Memproses..." : "Cocokkan yang Sudah Ada"}
          </button>
          <button
            onClick={function () { handleImport(true); }}
            disabled={rows.length === 0 || loading}
            className="px-5 py-2 rounded-lg text-sm"
            style={{ border: "1px solid var(--color-accent)", color: "var(--color-accent)", opacity: rows.length === 0 || loading ? 0.5 : 1 }}
          >
            {loading ? "Memproses..." : "Cocokkan + Buat Titik Hotspot Baru"}
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-lg p-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-sm font-medium mb-2">
            {result.matched} dari {result.total} berhasil dicocokkan ({result.matchedExact} exact, {result.matchedFuzzy} fuzzy/typo)
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