// app/(dashboard)/pengguna/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Staff {
  id: string;
  nama: string;
  role: string;
  no_hp: string | null;
  auth_user_id: string;
}

const roleStyle: Record<string, { bg: string; color: string; label: string }> = {
  super_admin: { bg: "#FADCDC", color: "#B5342E", label: "Super Admin" },
  admin: { bg: "#DDEBFF", color: "#1D5FBF", label: "Admin" },
  teknisi: { bg: "#FDEEDB", color: "#B5730B", label: "Teknisi" },
};

export default function PenggunaPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [noHp, setNoHp] = useState("");
  const [role, setRole] = useState("admin");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from("staff").select("id, nama, role, no_hp, auth_user_id").order("nama");
    setStaffList(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleTambahStaff() {
    setSaving(true);
    const res = await fetch("/api/staff/create", {
      method: "POST",
      body: JSON.stringify({ nama, email, noHp, role, password: password || undefined }),
    });
    const json = await res.json();
    setSaving(false);
    alert(json.message);
    setShowForm(false);
    setNama("");
    setEmail("");
    setNoHp("");
    setPassword("");
    loadData();
  }

  async function handleResetPassword(authUserId: string) {
    if (!resetPassword || resetPassword.length < 6) {
      alert("Password minimal 6 karakter");
      return;
    }
    setResetting(true);
    const res = await fetch("/api/staff/reset-password", {
      method: "POST",
      body: JSON.stringify({ authUserId, newPassword: resetPassword }),
    });
    const json = await res.json();
    setResetting(false);
    alert(json.message);
    setResetTargetId(null);
    setResetPassword("");
  }

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Manajemen Pengguna</h1>
          <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
            {staffList.length} staff terdaftar
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--color-accent)" }}
        >
          + Tambah Staff
        </button>
      </div>

      {showForm && (
        <div
          className="p-5 rounded-lg mb-6 flex gap-2 flex-wrap items-end"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Nama</label>
            <input value={nama} onChange={(e) => setNama(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Password (kosongkan = acak otomatis)</label>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 karakter" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>No HP</label>
            <input value={noHp} onChange={(e) => setNoHp(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="teknisi">Teknisi</option>
            </select>
          </div>
          <button
            onClick={handleTambahStaff}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm text-white"
            style={{ background: "var(--color-signal-good)" }}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      )}

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table className="w-full">
          <thead>
            <tr><th>Nama</th><th>Role</th><th>No HP</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {staffList.map((s) => (
              <tr key={s.id}>
                <td>{s.nama}</td>
                <td>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ background: roleStyle[s.role]?.bg, color: roleStyle[s.role]?.color }}
                  >
                    {roleStyle[s.role]?.label ?? s.role}
                  </span>
                </td>
                <td className="mono">{s.no_hp ?? "-"}</td>
                <td>
                  {resetTargetId === s.auth_user_id ? (
                    <div className="flex gap-1 items-center">
                      <input
                        type="text"
                        placeholder="Password baru"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        style={{ ...inputStyle, width: 130, padding: "4px 8px" }}
                      />
                      <button
                        onClick={() => handleResetPassword(s.auth_user_id)}
                        disabled={resetting}
                        className="px-2 py-1 rounded text-xs text-white"
                        style={{ background: "var(--color-signal-good)" }}
                      >
                        {resetting ? "..." : "Simpan"}
                      </button>
                      <button
                        onClick={() => { setResetTargetId(null); setResetPassword(""); }}
                        className="px-2 py-1 rounded text-xs"
                        style={{ border: "1px solid var(--color-border)" }}
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResetTargetId(s.auth_user_id)}
                      className="px-2 py-1 rounded text-xs"
                      style={{ border: "1px solid var(--color-border)" }}
                    >
                      Reset Password
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {staffList.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8" style={{ color: "var(--color-ink-muted)" }}>
                  Belum ada staff terdaftar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}