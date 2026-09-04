// app/(dashboard)/pelanggan/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

interface Pelanggan {
  id: string;
  nama: string;
  no_hp: string;
  alamat: string;
  latitude: number | null;
  longitude: number | null;
  tipe_langganan: string;
  pppoe_username: string | null;
  paket_bulanan_id: string | null;
  lokasi_id: string | null;
  status: string;
  tanggal_jatuh_tempo: string | null;
  disable_otomatis: boolean | null;
  paket_bulanan?: { nama: string } | null;
  lokasi?: { nama: string } | null;
}

interface Lokasi {
  id: string;
  nama: string;
}

interface PaketBulanan {
  id: string;
  nama: string;
  harga_per_bulan: number;
}

const emptyForm = {
  nama: "",
  no_hp: "",
  alamat: "",
  latitude: "",
  longitude: "",
  tipe_langganan: "hotspot_voucher",
  pppoe_username: "",
  paket_bulanan_id: "",
  lokasi_id: "",
};

export default function PelangganPage() {
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [paketList, setPaketList] = useState<PaketBulanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [routerList, setRouterList] = useState<{ id: string; nama: string }[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const inputStyle = { border: "1px solid #ccc", borderRadius: 4, padding: "6px 12px", width: "100%", boxSizing: "border-box" as const };

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: pelangganData, error: errPelanggan } = await supabase
      .from("pelanggan")
      .select("*, paket_bulanan(nama), lokasi:lokasi_id(nama)")
      .order("nama");

    if (errPelanggan) console.error("Gagal load pelanggan:", errPelanggan);

    const { data: lokasiData } = await supabase
      .from("lokasi")
      .select("id, nama")
      .order("nama");

    const { data: paketData } = await supabase
      .from("paket_bulanan")
      .select("id, nama, harga_per_bulan")
      .order("harga_per_bulan");

    const { data: routerData } = await supabase
      .from("router")
      .select("id, nama");

    setPelangganList((pelangganData as unknown as Pelanggan[]) ?? []);
    setLokasiList(lokasiData ?? []);
    setPaketList(paketData ?? []);
    setRouterList(routerData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openTambahForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(p: Pelanggan) {
    setForm({
      nama: p.nama,
      no_hp: p.no_hp ?? "",
      alamat: p.alamat ?? "",
      latitude: p.latitude?.toString() ?? "",
      longitude: p.longitude?.toString() ?? "",
      tipe_langganan: p.tipe_langganan,
      pppoe_username: p.pppoe_username ?? "",
      paket_bulanan_id: p.paket_bulanan_id ?? "",
      lokasi_id: p.lokasi_id ?? "",
    });
    setEditingId(p.id);
    setShowForm(true);
  }

  async function handleSimpan() {
    const parsedLat = parseFloat(form.latitude);
    const parsedLong = parseFloat(form.longitude);

    const payload = {
      nama: form.nama,
      no_hp: form.no_hp || null,
      alamat: form.alamat || null,
      latitude: form.latitude && !isNaN(parsedLat) ? parsedLat : null,
      longitude: form.longitude && !isNaN(parsedLong) ? parsedLong : null,
      tipe_langganan: form.tipe_langganan,
      pppoe_username: form.tipe_langganan === "pppoe_bulanan" ? form.pppoe_username : null,
      paket_bulanan_id: form.tipe_langganan === "pppoe_bulanan" ? (form.paket_bulanan_id || null) : null,
      lokasi_id: form.lokasi_id || null,
    };

    if (editingId) {
      await supabase.from("pelanggan").update(payload).eq("id", editingId);
    } else {
      await supabase.from("pelanggan").insert(payload);
    }

    setShowForm(false);
    loadData();
  }

  async function handleHapus(id: string) {
    if (!window.confirm("Yakin mau hapus pelanggan ini?")) return;
    await supabase.from("pelanggan").delete().eq("id", id);
    loadData();
  }

  async function handleImportMikrotik() {
    if (routerList.length === 0) {
      alert("Belum ada router terdaftar di sistem");
      return;
    }

    const routerId = routerList.length === 1
      ? routerList[0].id
      : prompt(`Pilih router (masukkan salah satu ID):\n${routerList.map((r) => `${r.id} - ${r.nama}`).join("\n")}`);

    if (!routerId) return;

    setImporting(true);
    const res = await fetch("/api/pelanggan/import-mikrotik", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routerId }),
    });
    const json = await res.json();
    setImporting(false);
    alert(json.message);
    loadData();
  }

  async function handleToggleAutoDisable(pelangganId: string, current: boolean | null) {
    setTogglingId(pelangganId);
    try {
      const res = await fetch("/api/billing/toggle-auto-disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pelangganIds: [pelangganId], disableOtomatis: !current }),
      });
      if (!res.ok) {
        const json = await res.json();
        alert(`Gagal update: ${json.message}`);
      } else {
        setPelangganList(function (prev) {
          return prev.map(function (p) {
            return p.id === pelangganId ? { ...p, disable_otomatis: !current } : p;
          });
        });
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleBulkAutoDisable(enable: boolean) {
    const targetIds = pelangganList
      .filter(function (p) { return p.tipe_langganan === "pppoe_bulanan"; })
      .map(function (p) { return p.id; });

    if (targetIds.length === 0) {
      alert("Tidak ada pelanggan PPPoE Bulanan");
      return;
    }

    const konfirmasi = window.confirm(
      enable
        ? `Aktifkan Auto-Disable untuk ${targetIds.length} pelanggan PPPoE Bulanan? Modem mereka akan otomatis dimatikan kalau lewat jatuh tempo.`
        : `Matikan Auto-Disable untuk ${targetIds.length} pelanggan PPPoE Bulanan? Modem mereka TIDAK akan otomatis dimatikan meski lewat jatuh tempo.`
    );
    if (!konfirmasi) return;

    setBulkProcessing(true);
    try {
      const res = await fetch("/api/billing/toggle-auto-disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pelangganIds: targetIds, disableOtomatis: enable }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(`Gagal update: ${json.message}`);
      } else {
        alert(json.message);
        loadData();
      }
    } finally {
      setBulkProcessing(false);
    }
  }

  const filteredList = pelangganList.filter(
    (p) =>
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      (p.no_hp && p.no_hp.includes(search))
  );

  const jumlahPppoe = pelangganList.filter(function (p) { return p.tipe_langganan === "pppoe_bulanan"; }).length;

  if (loading) return <p>Memuat...</p>;

  return (
    <div>
      <h1>Data Pelanggan</h1>

      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <input
          placeholder="Cari nama/no HP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 4 }}
        />
        <button onClick={openTambahForm} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--color-accent)" }}>
          + Tambah Pelanggan
        </button>
        <button
          onClick={handleImportMikrotik}
          disabled={importing}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ border: "1px solid var(--color-accent)", color: "var(--color-accent)" }}
        >
          {importing ? "Mengimpor..." : "Import dari Mikrotik"}
        </button>
      </div>

      {jumlahPppoe > 0 && (
        <div
          style={{
            marginBottom: 15,
            padding: "12px 16px",
            borderRadius: 8,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Auto-Disable Modem</p>
            <p style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>
              Matikan otomatis internet pelanggan PPPoE Bulanan yang lewat jatuh tempo (dicek tiap hari)
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleBulkAutoDisable(true)}
              disabled={bulkProcessing}
              className="px-3 py-1.5 rounded text-sm text-white"
              style={{ background: "var(--color-signal-good)", opacity: bulkProcessing ? 0.6 : 1 }}
            >
              Aktifkan Semua
            </button>
            <button
              onClick={() => handleBulkAutoDisable(false)}
              disabled={bulkProcessing}
              className="px-3 py-1.5 rounded text-sm"
              style={{ border: "1px solid var(--color-border)", opacity: bulkProcessing ? 0.6 : 1 }}
            >
              Matikan Semua
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 15, borderRadius: 8, background: "#f9f9f9" }}>
          <h3>{editingId ? "Edit Pelanggan" : "Tambah Pelanggan"}</h3>

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input
              placeholder="Nama"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="No HP"
              value={form.no_hp}
              onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              placeholder="Alamat"
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)", fontSize: 12 }}>
              Lokasi Titik (GPS)
            </label>
            <LocationPicker
              latitude={form.latitude ? parseFloat(form.latitude) : null}
              longitude={form.longitude ? parseFloat(form.longitude) : null}
              onChange={(lat, lng, address) =>
                setForm({
                  ...form,
                  latitude: lat.toString(),
                  longitude: lng.toString(),
                  alamat: address ?? form.alamat,
                })
              }
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <select
              value={form.lokasi_id}
              onChange={(e) => setForm({ ...form, lokasi_id: e.target.value })}
              style={inputStyle}
            >
              <option value="">- Pilih Lokasi -</option>
              {lokasiList.map((l) => (
                <option key={l.id} value={l.id}>{l.nama}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>
              <input
                type="radio"
                checked={form.tipe_langganan === "hotspot_voucher"}
                onChange={() => setForm({ ...form, tipe_langganan: "hotspot_voucher" })}
              />
              {" "}Hotspot Voucher
            </label>
            <label style={{ marginLeft: 15 }}>
              <input
                type="radio"
                checked={form.tipe_langganan === "pppoe_bulanan"}
                onChange={() => setForm({ ...form, tipe_langganan: "pppoe_bulanan" })}
              />
              {" "}PPPoE Bulanan
            </label>
          </div>

          {form.tipe_langganan === "pppoe_bulanan" && (
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <input
                placeholder="Username PPPoE"
                value={form.pppoe_username}
                onChange={(e) => setForm({ ...form, pppoe_username: e.target.value })}
                style={inputStyle}
              />
              <select
                value={form.paket_bulanan_id}
                onChange={(e) => setForm({ ...form, paket_bulanan_id: e.target.value })}
                style={inputStyle}
              >
                <option value="">- Pilih Paket -</option>
                {paketList.map((pk) => (
                  <option key={pk.id} value={pk.id}>
                    {pk.nama} (Rp {pk.harga_per_bulan.toLocaleString("id-ID")}/bulan)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginTop: 15 }}>
            <button onClick={handleSimpan} style={{ padding: "6px 12px", background: "blue", color: "white", borderRadius: 4, border: "none" }}>
              Simpan
            </button>
            <button onClick={() => setShowForm(false)} style={{ marginLeft: 10, padding: "6px 12px" }}>
              Batal
            </button>
          </div>
        </div>
      )}

      <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Nama</th>
            <th style={{ padding: 8 }}>No HP</th>
            <th style={{ padding: 8 }}>Lokasi</th>
            <th style={{ padding: 8 }}>Tipe</th>
            <th style={{ padding: 8 }}>Paket/Username</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Jatuh Tempo</th>
            <th style={{ padding: 8 }}>Auto-Disable</th>
            <th style={{ padding: 8 }}>GPS</th>
            <th style={{ padding: 8 }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filteredList.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{p.nama}</td>
              <td style={{ padding: 8 }}>{p.no_hp}</td>
              <td style={{ padding: 8 }}>{p.lokasi?.nama ?? "-"}</td>
              <td style={{ padding: 8 }}>{p.tipe_langganan === "hotspot_voucher" ? "Voucher" : "Bulanan"}</td>
              <td style={{ padding: 8 }}>
                {p.tipe_langganan === "pppoe_bulanan"
                  ? `${p.pppoe_username ?? "-"} (${p.paket_bulanan?.nama ?? "-"})`
                  : "-"}
              </td>
              <td style={{ padding: 8 }}>{p.status}</td>
              <td style={{ padding: 8 }}>
                {p.tipe_langganan === "pppoe_bulanan" && p.tanggal_jatuh_tempo
                  ? new Date(p.tanggal_jatuh_tempo).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                  : "-"}
              </td>
              <td style={{ padding: 8 }}>
                {p.tipe_langganan === "pppoe_bulanan" ? (
                  <button
                    onClick={() => handleToggleAutoDisable(p.id, p.disable_otomatis)}
                    disabled={togglingId === p.id}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 12,
                      border: "none",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      background: p.disable_otomatis ? "#DCF5E4" : "#F0F0F0",
                      color: p.disable_otomatis ? "#1D8348" : "#666",
                      opacity: togglingId === p.id ? 0.6 : 1,
                    }}
                  >
                    {p.disable_otomatis ? "ON" : "OFF"}
                  </button>
                ) : (
                  "-"
                )}
              </td>
              <td style={{ padding: 8 }}>
                {p.latitude && p.longitude ? (
                  <a // <--- PERBAIKAN DI SINI, SEBELUMNYA TAG <a> HILANG
                    href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--color-accent)", textDecoration: "none" }}
                    title="Buka di Google Maps"
                  >
                    📍 Lihat
                  </a>
                ) : (
                  <span style={{ color: "#999" }}>-</span>
                )}
              </td>
              <td style={{ padding: 8 }}>
                <button onClick={() => openEditForm(p)}>Edit</button>
                <button onClick={() => handleHapus(p.id)} style={{ marginLeft: 5 }}>
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}