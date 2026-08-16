"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Upload } from "lucide-react";

const LocationPicker = dynamic(function () { return import("@/components/LocationPicker"); }, { ssr: false });

interface TitikJaringan {
  id: string;
  nama: string;
  tipe: string;
  kapasitas_port: number | null;
  port_terpakai: number | null;
  latitude: number;
  longitude: number;
  keterangan: string | null;
  lokasi_id: string | null;
}

const emptyForm = {
  nama: "",
  tipe: "odc",
  kapasitas_port: "",
  port_terpakai: "",
  latitude: "",
  longitude: "",
  keterangan: "",
};

const PAGE_SIZE_OPTIONS = [10, 30, -1];

function pageSizeLabel(size: number) {
  return size === -1 ? "Semua" : String(size);
}

export default function OdcOdpPage() {
  const [list, setList] = useState<TitikJaringan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterTipe, setFilterTipe] = useState("semua");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/titik-jaringan");
    const json = await res.json();
    setList(json.data || []);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, []);

  function openTambah() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(t: TitikJaringan) {
    setForm({
      nama: t.nama,
      tipe: t.tipe,
      kapasitas_port: t.kapasitas_port ? t.kapasitas_port.toString() : "",
      port_terpakai: t.port_terpakai ? t.port_terpakai.toString() : "",
      latitude: t.latitude.toString(),
      longitude: t.longitude.toString(),
      keterangan: t.keterangan || "",
    });
    setEditingId(t.id);
    setShowForm(true);
  }

  async function handleSimpan() {
    await fetch("/api/titik-jaringan", {
      method: "POST",
      body: JSON.stringify({
        id: editingId || undefined,
        nama: form.nama,
        tipe: form.tipe,
        kapasitas_port: form.kapasitas_port ? parseInt(form.kapasitas_port) : null,
        port_terpakai: form.port_terpakai ? parseInt(form.port_terpakai) : 0,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        keterangan: form.keterangan || null,
      }),
    });
    setShowForm(false);
    loadData();
  }

  async function handleHapus(id: string) {
    if (!confirm("Yakin hapus titik ini?")) return;
    await fetch("/api/titik-jaringan", { method: "DELETE", body: JSON.stringify({ id: id }) });
    loadData();
  }

  function detectTipe(nama: string): string {
    const lower = nama.toLowerCase();
    if (lower.indexOf("odc") !== -1) return "odc";
    return "odp";
  }

  async function handleImportKml(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (event) {
      const text = event.target ? String(event.target.result) : "";
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const placemarks = xml.getElementsByTagName("Placemark");

      const rows: { nama: string; tipe: string; latitude: number; longitude: number; keterangan: string }[] = [];

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

        rows.push({
          nama: nama,
          tipe: detectTipe(nama),
          latitude: lat,
          longitude: lng,
          keterangan: "Diimpor dari KML (label asli: " + nama + ")",
        });
      }

      setImporting(true);
      const batchSize = 10;
      let imported = 0;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        await Promise.all(
          batch.map(function (row) {
            return fetch("/api/titik-jaringan", {
              method: "POST",
              body: JSON.stringify(row),
            });
          })
        );
        imported += batch.length;
        setImportProgress(imported + " / " + rows.length);
      }

      setImporting(false);
      setImportProgress("");
      alert(imported + " titik berhasil diimpor");
      loadData();
    };
    reader.readAsText(file);
  }

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  const filteredList = filterTipe === "semua" ? list : list.filter(function (t) { return t.tipe === filterTipe; });
  const totalOdc = list.filter(function (t) { return t.tipe === "odc"; }).length;
  const totalOdp = list.filter(function (t) { return t.tipe === "odp"; }).length;

  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredList.length / pageSize);
  const pagedList = pageSize === -1 ? filteredList : filteredList.slice(page * pageSize, page * pageSize + pageSize);

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-semibold">Titik ODC & ODP</h1>
        <div className="flex gap-2">
          <label
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer"
            style={{ border: "1px solid var(--color-accent)", color: "var(--color-accent)", opacity: importing ? 0.6 : 1 }}
          >
            <Upload size={16} />
            {importing ? "Mengimpor " + importProgress : "Import KML"}
            <input type="file" accept=".kml" onChange={handleImportKml} disabled={importing} style={{ display: "none" }} />
          </label>
          <button
            onClick={openTambah}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--color-accent)" }}
          >
            + Tambah Titik
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 text-sm">
        <span style={{ color: "var(--color-ink-muted)" }}>Total: <b style={{ color: "var(--color-ink)" }}>{list.length}</b></span>
        <span style={{ color: "var(--color-ink-muted)" }}>ODC: <b style={{ color: "#8B5CF6" }}>{totalOdc}</b></span>
        <span style={{ color: "var(--color-ink-muted)" }}>ODP: <b style={{ color: "#F59E0B" }}>{totalOdp}</b></span>
      </div>

      {showForm && (
        <div className="p-5 rounded-lg mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", maxWidth: 500 }}>
          <h3 className="font-medium mb-3">{editingId ? "Edit Titik" : "Tambah Titik"}</h3>

          <div className="flex gap-2 mb-3">
            <input
              placeholder="Nama (misal: ODC-01)"
              value={form.nama}
              onChange={function (e) { setForm({ ...form, nama: e.target.value }); }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <select
              value={form.tipe}
              onChange={function (e) { setForm({ ...form, tipe: e.target.value }); }}
              style={inputStyle}
            >
              <option value="odc">ODC</option>
              <option value="odp">ODP</option>
            </select>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              placeholder="Kapasitas Port"
              type="number"
              value={form.kapasitas_port}
              onChange={function (e) { setForm({ ...form, kapasitas_port: e.target.value }); }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              placeholder="Port Terpakai"
              type="number"
              value={form.port_terpakai}
              onChange={function (e) { setForm({ ...form, port_terpakai: e.target.value }); }}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Lokasi Titik (GPS)</label>
            <LocationPicker
              latitude={form.latitude ? parseFloat(form.latitude) : null}
              longitude={form.longitude ? parseFloat(form.longitude) : null}
              onChange={function (lat: number, lng: number) {
                setForm({ ...form, latitude: lat.toString(), longitude: lng.toString() });
              }}
            />
          </div>

          <textarea
            placeholder="Keterangan (opsional)"
            value={form.keterangan}
            onChange={function (e) { setForm({ ...form, keterangan: e.target.value }); }}
            className="w-full mb-3"
            style={{ ...inputStyle, minHeight: 60 }}
          />

          <div className="flex gap-2">
            <button onClick={handleSimpan} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: "var(--color-signal-good)" }}>Simpan</button>
            <button onClick={function () { setShowForm(false); }} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)" }}>Batal</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          {["semua", "odc", "odp"].map(function (t) {
            return (
              <button
                key={t}
                onClick={function () { setFilterTipe(t); setPage(0); }}
                className="px-3 py-1.5 rounded text-sm"
                style={{
                  border: "1px solid var(--color-border)",
                  background: filterTipe === t ? "var(--color-accent)" : "transparent",
                  color: filterTipe === t ? "white" : "var(--color-ink)",
                }}
              >
                {t === "semua" ? "Semua" : t.toUpperCase()}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: "var(--color-ink-muted)" }}>Tampilkan:</span>
          {PAGE_SIZE_OPTIONS.map(function (size) {
            return (
              <button
                key={size}
                onClick={function () { setPageSize(size); setPage(0); }}
                className="px-3 py-1 rounded text-sm"
                style={{
                  border: "1px solid var(--color-border)",
                  background: pageSize === size ? "var(--color-accent)" : "transparent",
                  color: pageSize === size ? "white" : "var(--color-ink)",
                }}
              >
                {pageSizeLabel(size)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--color-bg)" }}>
              <th className="text-left p-3 text-sm">Nama</th>
              <th className="text-left p-3 text-sm">Tipe</th>
              <th className="text-left p-3 text-sm">Port</th>
              <th className="text-left p-3 text-sm">Koordinat</th>
              <th className="text-left p-3 text-sm">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pagedList.map(function (t) {
              return (
                <tr key={t.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td className="p-3 text-sm">{t.nama}</td>
                  <td className="p-3 text-sm">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ background: t.tipe === "odc" ? "#8B5CF622" : "#F59E0B22", color: t.tipe === "odc" ? "#8B5CF6" : "#F59E0B" }}
                    >
                      {t.tipe.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{t.kapasitas_port ? (t.port_terpakai || 0) + "/" + t.kapasitas_port : "-"}</td>
                  <td className="p-3 text-sm mono">{t.latitude.toFixed(5)}, {t.longitude.toFixed(5)}</td>
                  <td className="p-3">
                    <button onClick={function () { openEdit(t); }} className="px-2 py-1 rounded text-sm mr-1" style={{ border: "1px solid var(--color-border)" }}>Edit</button>
                    <button onClick={function () { handleHapus(t.id); }} className="px-2 py-1 rounded text-sm" style={{ border: "1px solid var(--color-signal-bad)", color: "var(--color-signal-bad)" }}>Hapus</button>
                  </td>
                </tr>
              );
            })}
            {filteredList.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                  Belum ada titik ODC/ODP
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {pageSize !== -1 && totalPages > 1 && (
          <div className="flex items-center justify-between p-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <button
              onClick={function () { setPage(Math.max(page - 1, 0)); }}
              disabled={page === 0}
              className="px-3 py-1.5 rounded text-sm"
              style={{ border: "1px solid var(--color-border)", opacity: page === 0 ? 0.4 : 1 }}
            >
              Sebelumnya
            </button>
            <span className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
              Halaman {page + 1} dari {totalPages}
            </span>
            <button
              onClick={function () { setPage(Math.min(page + 1, totalPages - 1)); }}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded text-sm"
              style={{ border: "1px solid var(--color-border)", opacity: page >= totalPages - 1 ? 0.4 : 1 }}
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}