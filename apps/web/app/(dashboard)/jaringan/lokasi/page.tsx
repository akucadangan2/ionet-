// app/(dashboard)/jaringan/lokasi/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Lokasi {
  id: string;
  nama: string;
  alamat: string;
  wireguard_status: string;
  router: { id: string; nama: string; ip_address: string; radius_registered: boolean }[];
}

export default function LokasiPage() {
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [namaBaru, setNamaBaru] = useState("");
  const [alamatBaru, setAlamatBaru] = useState("");

  async function loadData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("lokasi")
      .select("id, nama, alamat, wireguard_status, router(id, nama, ip_address, radius_registered)")
      .order("nama");
    if (error) console.error(error);
    setLokasiList(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function openTambahForm() {
    setEditingId(null);
    setNamaBaru("");
    setAlamatBaru("");
    setShowForm(true);
  }

  function openEditForm(l: Lokasi) {
    setEditingId(l.id);
    setNamaBaru(l.nama);
    setAlamatBaru(l.alamat ?? "");
    setShowForm(true);
  }

  async function handleSimpanLokasi() {
    const payload = { nama: namaBaru, alamat: alamatBaru };
    const { error } = editingId
      ? await supabase.from("lokasi").update(payload).eq("id", editingId)
      : await supabase.from("lokasi").insert(payload);

    if (error) {
      alert(`Gagal simpan: ${error.message}`);
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setNamaBaru("");
    setAlamatBaru("");
    loadData();
  }

  async function handleHapusLokasi(id: string) {
    if (!confirm("Yakin mau hapus lokasi ini? Router yang terdaftar di lokasi ini juga perlu dipindah dulu.")) return;
    const { error } = await supabase.from("lokasi").delete().eq("id", id);
    if (error) {
      alert(`Gagal hapus: ${error.message}`);
      return;
    }
    loadData();
  }

  async function handleOnboard(lokasiId: string, routerId: string, nasIp: string) {
    const res = await fetch("/api/lokasi/onboard", {
      method: "POST",
      body: JSON.stringify({ lokasiId, routerId, nasIp }),
    });
    const json = await res.json();
    alert(json.message);
    loadData();
  }

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Manajemen Lokasi</h1>
          <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
            {lokasiList.length} lokasi terdaftar
          </p>
        </div>
        <button
          onClick={openTambahForm}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--color-accent)" }}
        >
          + Tambah Lokasi Baru
        </button>
      </div>

      {showForm && (
        <div
          className="p-5 rounded-lg mb-6 flex gap-2 items-end"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Nama Lokasi</label>
            <input placeholder="misal: Cabang Sungai Penuh" value={namaBaru} onChange={(e) => setNamaBaru(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Alamat</label>
            <input value={alamatBaru} onChange={(e) => setAlamatBaru(e.target.value)} style={{ ...inputStyle, width: 300 }} />
          </div>
          <button
            onClick={handleSimpanLokasi}
            className="px-4 py-2 rounded-lg text-sm text-white"
            style={{ background: "var(--color-signal-good)" }}
          >
            Simpan
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ border: "1px solid var(--color-border)" }}
          >
            Batal
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {lokasiList.map((l) => (
          <div
            key={l.id}
            className="p-5 rounded-lg"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium">{l.nama}</p>
                <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>{l.alamat}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded text-xs font-medium"
                  style={{
                    background: l.wireguard_status === "connected" ? "#DCF5E4" : "#FADCDC",
                    color: l.wireguard_status === "connected" ? "#1D8348" : "#B5342E",
                  }}
                >
                  VPN {l.wireguard_status === "connected" ? "Connected" : "Disconnected"}
                </span>
                <button
                  onClick={() => openEditForm(l)}
                  className="px-2 py-1 rounded text-xs"
                  style={{ border: "1px solid var(--color-border)" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleHapusLokasi(l.id)}
                  className="px-2 py-1 rounded text-xs"
                  style={{ border: "1px solid var(--color-signal-bad)", color: "var(--color-signal-bad)" }}
                >
                  Hapus
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {l.router?.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-3 py-2 rounded"
                  style={{ background: "var(--color-bg)" }}
                >
                  <span className="text-sm mono">{r.nama} ({r.ip_address})</span>
                  {r.radius_registered ? (
                    <span className="text-sm" style={{ color: "var(--color-signal-good)" }}>✅ RADIUS OK</span>
                  ) : (
                    <button
                      onClick={() => {
                        const nasIp = prompt(`IP tunnel WireGuard router "${r.nama}" (misal 10.100.0.2):`);
                        if (nasIp) handleOnboard(l.id, r.id, nasIp);
                      }}
                      className="px-3 py-1 rounded text-xs text-white"
                      style={{ background: "var(--color-accent)" }}
                    >
                      Daftarkan ke RADIUS
                    </button>
                  )}
                </div>
              ))}
              {(!l.router || l.router.length === 0) && (
                <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>Belum ada router terdaftar</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm" style={{ color: "var(--color-ink-muted)" }}>
        Sebelum klik "Daftarkan ke RADIUS", pastikan setup WireGuard di Mikrotik lokasi udah selesai
        (lihat <code className="mono">docs/setup-wireguard-lokasi.md</code>) dan tunnel-nya connect.
      </p>
    </div>
  );
}