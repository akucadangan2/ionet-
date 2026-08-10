// app/(dashboard)/pengaturan/notifikasi/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Contact {
  id: string;
  label: string;
  no_hp: string;
  kategori: string;
  aktif: boolean;
}

const emptyForm = { id: "", label: "", no_hp: "", kategori: "admin" };

export default function NotifikasiSettingsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  
  // State untuk fitur test WA
  const [testPhone, setTestPhone] = useState("082278222721");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from("notification_contacts").select("*").order("kategori");
    setContacts(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSimpan() {
    await fetch("/api/pengaturan/notifikasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: form.id || undefined, label: form.label, no_hp: form.no_hp, kategori: form.kategori }),
    });
    setShowForm(false);
    setForm(emptyForm);
    loadData();
  }

  async function handleHapus(id: string) {
    if (!window.confirm("Yakin mau hapus kontak ini?")) return;
    await fetch("/api/pengaturan/notifikasi", { 
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }) 
    });
    loadData();
  }

  async function toggleAktif(c: Contact) {
    await fetch("/api/pengaturan/notifikasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, label: c.label, no_hp: c.no_hp, kategori: c.kategori, aktif: !c.aktif }),
    });
    loadData();
  }

  async function handleTestWa() {
    if (!testPhone) {
      alert("Isi nomor WA dulu");
      return;
    }
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/test/wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone, message: "Testing WA gateway IONET+ 🚀" }),
      });
      const json = await res.json();
      setTestResult({
        success: json.success,
        message: json.success ? "Berhasil dikirim! Cek HP tujuan." : json.message,
      });
    } catch (err) {
      setTestResult({ success: false, message: "Gagal koneksi ke server" });
    } finally {
      setTesting(false);
    }
  }

  function editContact(c: Contact) {
    setForm({ id: c.id, label: c.label, no_hp: c.no_hp, kategori: c.kategori });
    setShowForm(true);
  }

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Pengaturan Notifikasi WA</h1>
          <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
            Kelola nomor yang menerima notifikasi tiket gangguan & validasi pembayaran
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true); }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--color-accent)" }}
        >
          + Tambah Kontak
        </button>
      </div>

      <div
        className="p-5 rounded-lg mb-8"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <h3 className="text-sm font-medium mb-3">Test Kirim WA</h3>
        <div className="flex gap-2 items-center flex-wrap">
          <input
            placeholder="Nomor WA (misal: 08561234567)"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px", width: 220 }}
          />
          <button
            onClick={handleTestWa}
            disabled={testing}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--color-accent)" }}
          >
            {testing ? "Mengirim..." : "Kirim Test"}
          </button>
        </div>
        {testResult && (
          <p
            className="text-sm mt-3"
            style={{ color: testResult.success ? "var(--color-signal-good)" : "var(--color-signal-bad)" }}
          >
            {testResult.success ? "✅" : "❌"} {testResult.message}
          </p>
        )}
      </div>

      {showForm && (
        <div className="p-5 rounded-lg mb-6 flex gap-2 flex-wrap items-end" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Label</label>
            <input placeholder="misal: Admin Utama" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>No WA</label>
            <input placeholder="62812xxxxxxx" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Kategori</label>
            <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} style={inputStyle}>
              <option value="admin">Admin</option>
              <option value="teknisi">Teknisi</option>
            </select>
          </div>
          <button onClick={handleSimpan} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: "var(--color-signal-good)" }}>Simpan</button>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)" }}>Batal</button>
        </div>
      )}

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: "12px 16px" }}>Label</th>
              <th style={{ padding: "12px 16px" }}>No WA</th>
              <th style={{ padding: "12px 16px" }}>Kategori</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px 16px" }}>{c.label}</td>
                <td className="mono" style={{ padding: "12px 16px" }}>{c.no_hp}</td>
                <td className="capitalize" style={{ padding: "12px 16px" }}>{c.kategori}</td>
                <td style={{ padding: "12px 16px" }}>
                  <button
                    onClick={() => toggleAktif(c)}
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: c.aktif ? "#DCF5E4" : "#EEECE8",
                      color: c.aktif ? "#1D8348" : "#6B7280",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    {c.aktif ? "Aktif" : "Nonaktif"}
                  </button>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={() => editContact(c)} className="px-2 py-1 rounded text-sm mr-1" style={{ border: "1px solid var(--color-border)", background: "transparent", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => handleHapus(c.id)} className="px-2 py-1 rounded text-sm" style={{ border: "1px solid var(--color-signal-bad)", color: "var(--color-signal-bad)", background: "transparent", cursor: "pointer" }}>Hapus</button>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8" style={{ color: "var(--color-ink-muted)", padding: "32px 0", textAlign: "center" }}>
                  Belum ada kontak notifikasi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}