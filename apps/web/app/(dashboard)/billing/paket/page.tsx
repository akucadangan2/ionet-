// app/(dashboard)/billing/paket/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface PaketVoucher {
  id: string; nama: string; harga: number; durasi_menit: number; profile_mikrotik: string;
  limit_data_mb: number | null; limit_kecepatan: string | null;
}
interface PaketBulanan {
  id: string; nama: string; harga_per_bulan: number; kecepatan: string;
}

const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

export default function PaketPage() {
  const [voucherList, setVoucherList] = useState<PaketVoucher[]>([]);
  const [bulananList, setBulananList] = useState<PaketBulanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [voucherForm, setVoucherForm] = useState({ id: "", nama: "", harga: "", durasi_menit: "", profile_mikrotik: "", limit_data_mb: "", limit_kecepatan: "" });
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [bulananForm, setBulananForm] = useState({ id: "", nama: "", harga_per_bulan: "", kecepatan: "" });
  const [showBulananForm, setShowBulananForm] = useState(false);

  async function loadData() {
    setLoading(true);
    const { data: voucherData } = await supabase.from("paket_voucher").select("*").order("harga");
    const { data: bulananData } = await supabase.from("paket_bulanan").select("*").order("harga_per_bulan");
    setVoucherList(voucherData ?? []);
    setBulananList(bulananData ?? []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function saveVoucher() {
    await fetch("/api/paket/voucher", {
      method: "POST",
      body: JSON.stringify({
        id: voucherForm.id || undefined, nama: voucherForm.nama,
        harga: parseFloat(voucherForm.harga), durasi_menit: parseInt(voucherForm.durasi_menit),
        profile_mikrotik: voucherForm.profile_mikrotik,
        limit_data_mb: voucherForm.limit_data_mb ? parseInt(voucherForm.limit_data_mb) : null,
        limit_kecepatan: voucherForm.limit_kecepatan || null,
      }),
    });
    setShowVoucherForm(false);
    setVoucherForm({ id: "", nama: "", harga: "", durasi_menit: "", profile_mikrotik: "", limit_data_mb: "", limit_kecepatan: "" });
    loadData();
  }

  async function deleteVoucher(id: string) {
    if (!confirm("Yakin hapus paket ini?")) return;
    await fetch("/api/paket/voucher", { method: "DELETE", body: JSON.stringify({ id }) });
    loadData();
  }

  function editVoucher(p: PaketVoucher) {
    setVoucherForm({
      id: p.id, nama: p.nama, harga: p.harga.toString(), durasi_menit: p.durasi_menit.toString(),
      profile_mikrotik: p.profile_mikrotik,
      limit_data_mb: p.limit_data_mb ? p.limit_data_mb.toString() : "",
      limit_kecepatan: p.limit_kecepatan || "",
    });
    setShowVoucherForm(true);
  }

  async function saveBulanan() {
    await fetch("/api/paket/bulanan", {
      method: "POST",
      body: JSON.stringify({
        id: bulananForm.id || undefined, nama: bulananForm.nama,
        harga_per_bulan: parseFloat(bulananForm.harga_per_bulan), kecepatan: bulananForm.kecepatan,
      }),
    });
    setShowBulananForm(false);
    setBulananForm({ id: "", nama: "", harga_per_bulan: "", kecepatan: "" });
    loadData();
  }

  async function deleteBulanan(id: string) {
    if (!confirm("Yakin hapus paket ini?")) return;
    await fetch("/api/paket/bulanan", { method: "DELETE", body: JSON.stringify({ id }) });
    loadData();
  }

  function editBulanan(p: PaketBulanan) {
    setBulananForm({ id: p.id, nama: p.nama, harga_per_bulan: p.harga_per_bulan.toString(), kecepatan: p.kecepatan ?? "" });
    setShowBulananForm(true);
  }

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Manajemen Paket Harga</h1>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium uppercase tracking-wide" style={{ color: "var(--color-ink-muted)" }}>
            Paket Voucher Hotspot
          </h2>
          <button
            onClick={() => { setVoucherForm({ id: "", nama: "", harga: "", durasi_menit: "", profile_mikrotik: "", limit_data_mb: "", limit_kecepatan: "" }); setShowVoucherForm(true); }}
            className="px-3 py-1.5 rounded text-sm font-medium text-white"
            style={{ background: "var(--color-accent)" }}
          >
            + Tambah
          </button>
        </div>

        {showVoucherForm && (
          <div className="p-4 rounded-lg mb-3 flex gap-2 flex-wrap items-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <input placeholder="Nama (misal: 1 Hari)" value={voucherForm.nama} onChange={(e) => setVoucherForm({ ...voucherForm, nama: e.target.value })} style={inputStyle} />
            <input placeholder="Harga" type="number" value={voucherForm.harga} onChange={(e) => setVoucherForm({ ...voucherForm, harga: e.target.value })} style={{ ...inputStyle, width: 110 }} />
            <input placeholder="Durasi (menit)" type="number" value={voucherForm.durasi_menit} onChange={(e) => setVoucherForm({ ...voucherForm, durasi_menit: e.target.value })} style={{ ...inputStyle, width: 130 }} />
            <input placeholder="Profile Mikrotik" value={voucherForm.profile_mikrotik} onChange={(e) => setVoucherForm({ ...voucherForm, profile_mikrotik: e.target.value })} style={inputStyle} />
            <input placeholder="Limit Data (MB, kosongkan jika unlimited)" type="number" value={voucherForm.limit_data_mb} onChange={(e) => setVoucherForm({ ...voucherForm, limit_data_mb: e.target.value })} style={{ ...inputStyle, width: 200 }} />
            <input placeholder="Limit Kecepatan (misal 3M/3M)" value={voucherForm.limit_kecepatan} onChange={(e) => setVoucherForm({ ...voucherForm, limit_kecepatan: e.target.value })} style={inputStyle} />
            <button onClick={saveVoucher} className="px-3 py-2 rounded text-sm text-white" style={{ background: "var(--color-signal-good)" }}>Simpan</button>
            <button onClick={() => setShowVoucherForm(false)} className="px-3 py-2 rounded text-sm" style={{ border: "1px solid var(--color-border)" }}>Batal</button>
          </div>
        )}

        <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <table>
            <thead><tr><th>Nama</th><th>Harga</th><th>Durasi</th><th>Profile Mikrotik</th><th>Limit Data</th><th>Aksi</th></tr></thead>
            <tbody>
              {voucherList.map((p) => (
                <tr key={p.id}>
                  <td>{p.nama}</td>
                  <td>Rp {p.harga.toLocaleString("id-ID")}</td>
                  <td>{p.durasi_menit} menit</td>
                  <td className="mono">{p.profile_mikrotik}</td>
                  <td className="mono">{p.limit_data_mb ? p.limit_data_mb + " MB" : "Unlimited"}</td>
                  <td>
                    <button onClick={() => editVoucher(p)} className="px-2 py-1 rounded text-sm mr-1" style={{ border: "1px solid var(--color-border)" }}>Edit</button>
                    <button onClick={() => deleteVoucher(p.id)} className="px-2 py-1 rounded text-sm" style={{ border: "1px solid var(--color-signal-bad)", color: "var(--color-signal-bad)" }}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium uppercase tracking-wide" style={{ color: "var(--color-ink-muted)" }}>
            Paket Langganan Bulanan
          </h2>
          <button
            onClick={() => { setBulananForm({ id: "", nama: "", harga_per_bulan: "", kecepatan: "" }); setShowBulananForm(true); }}
            className="px-3 py-1.5 rounded text-sm font-medium text-white"
            style={{ background: "var(--color-accent)" }}
          >
            + Tambah
          </button>
        </div>

        {showBulananForm && (
          <div className="p-4 rounded-lg mb-3 flex gap-2 flex-wrap items-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <input placeholder="Nama Paket" value={bulananForm.nama} onChange={(e) => setBulananForm({ ...bulananForm, nama: e.target.value })} style={inputStyle} />
            <input placeholder="Harga per Bulan" type="number" value={bulananForm.harga_per_bulan} onChange={(e) => setBulananForm({ ...bulananForm, harga_per_bulan: e.target.value })} style={{ ...inputStyle, width: 150 }} />
            <input placeholder="Kecepatan (misal: 10 Mbps)" value={bulananForm.kecepatan} onChange={(e) => setBulananForm({ ...bulananForm, kecepatan: e.target.value })} style={inputStyle} />
            <button onClick={saveBulanan} className="px-3 py-2 rounded text-sm text-white" style={{ background: "var(--color-signal-good)" }}>Simpan</button>
            <button onClick={() => setShowBulananForm(false)} className="px-3 py-2 rounded text-sm" style={{ border: "1px solid var(--color-border)" }}>Batal</button>
          </div>
        )}

        <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <table>
            <thead><tr><th>Nama</th><th>Harga/Bulan</th><th>Kecepatan</th><th>Aksi</th></tr></thead>
            <tbody>
              {bulananList.map((p) => (
                <tr key={p.id}>
                  <td>{p.nama}</td>
                  <td>Rp {p.harga_per_bulan.toLocaleString("id-ID")}</td>
                  <td className="mono">{p.kecepatan}</td>
                  <td>
                    <button onClick={() => editBulanan(p)} className="px-2 py-1 rounded text-sm mr-1" style={{ border: "1px solid var(--color-border)" }}>Edit</button>
                    <button onClick={() => deleteBulanan(p.id)} className="px-2 py-1 rounded text-sm" style={{ border: "1px solid var(--color-signal-bad)", color: "var(--color-signal-bad)" }}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}