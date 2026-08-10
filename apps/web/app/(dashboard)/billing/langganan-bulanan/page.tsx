// app/(dashboard)/billing/langganan-bulanan/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface PembayaranBulanan {
  id: string;
  jumlah_bulan: number;
  nominal: number;
  metode: string;
  status: string;
  pelanggan: { id: string; nama: string; status: string };
}

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  menunggu_validasi: { bg: "#FDEEDB", color: "#B5730B", label: "Menunggu Validasi" },
  lunas: { bg: "#DCF5E4", color: "#1D8348", label: "Lunas" },
  ditolak: { bg: "#FADCDC", color: "#B5342E", label: "Ditolak" },
};

export default function LanggananBulananPage() {
  const [payments, setPayments] = useState<PembayaranBulanan[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPayments() {
    setLoading(true);
    const { data } = await supabase
      .from("pembayaran_bulanan")
      .select("*, pelanggan(id, nama, status)")
      .in("status", ["menunggu_validasi", "lunas"])
      .order("created_at", { ascending: false });
    setPayments(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function handleValidasi(paymentId: string) {
    const res = await fetch("/api/billing/validate-payment", {
      method: "POST",
      body: JSON.stringify({ paymentId, adminId: null }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(`Gagal validasi: ${json.message}`);
    }
    loadPayments();
  }

  async function handleAktivasiModem(pelangganId: string) {
    await fetch("/api/billing/activate-modem", { method: "POST", body: JSON.stringify({ pelangganId }) });
    loadPayments();
  }

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  const menungguValidasi = payments.filter((p) => p.status === "menunggu_validasi").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Langganan Bulanan</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        {menungguValidasi > 0 ? (
          <span style={{ color: "var(--color-signal-warn)", fontWeight: 500 }}>
            {menungguValidasi} pembayaran menunggu validasi
          </span>
        ) : (
          "Semua pembayaran sudah tervalidasi"
        )}
      </p>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table>
          <thead>
            <tr>
              <th>Pelanggan</th>
              <th>Jumlah Bulan</th>
              <th>Nominal</th>
              <th>Metode</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.pelanggan?.nama}</td>
                <td>{p.jumlah_bulan} bulan</td>
                <td>Rp {p.nominal.toLocaleString("id-ID")}</td>
                <td className="capitalize">{p.metode}</td>
                <td>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ background: statusStyle[p.status]?.bg, color: statusStyle[p.status]?.color }}
                  >
                    {statusStyle[p.status]?.label ?? p.status}
                  </span>
                </td>
                <td>
                  {p.status === "menunggu_validasi" && (
                    <button
                      onClick={() => handleValidasi(p.id)}
                      className="px-3 py-1.5 rounded text-sm text-white"
                      style={{ background: "var(--color-accent)" }}
                    >
                      Validasi
                    </button>
                  )}
                  {p.status === "lunas" && p.pelanggan?.status !== "aktif" && (
                    <button
                      onClick={() => handleAktivasiModem(p.pelanggan.id)}
                      className="px-3 py-1.5 rounded text-sm text-white"
                      style={{ background: "var(--color-signal-good)" }}
                    >
                      Aktifkan Modem
                    </button>
                  )}
                  {p.status === "lunas" && p.pelanggan?.status === "aktif" && (
                    <span className="text-sm" style={{ color: "var(--color-ink-muted)" }}>Modem aktif</span>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8" style={{ color: "var(--color-ink-muted)" }}>
                  Belum ada pembayaran bulanan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}