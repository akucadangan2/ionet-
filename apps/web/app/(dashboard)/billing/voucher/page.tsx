// app/(dashboard)/billing/voucher/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface PaketVoucher {
  id: string;
  nama: string;
  harga: number;
  durasi_menit: number;
}

interface Lokasi {
  id: string;
  nama: string;
}

interface TransaksiVoucher {
  id: string;
  nominal_dibayar: number;
  metode: string;
  status: string;
  kode_voucher: string | null;
  created_at: string;
  paket_voucher: { nama: string } | null;
}

export default function VoucherPage() {
  const router = useRouter();
  const [paketList, setPaketList] = useState<PaketVoucher[]>([]);
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [riwayat, setRiwayat] = useState<TransaksiVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaket, setSelectedPaket] = useState("");
  const [selectedLokasi, setSelectedLokasi] = useState("");
  const [noHp, setNoHp] = useState("");
  const [generating, setGenerating] = useState(false);
  const [hasilVoucher, setHasilVoucher] = useState<{ username: string; password: string; strukId: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: paketData } = await supabase.from("paket_voucher").select("id, nama, harga, durasi_menit").order("harga");
    const { data: lokasiData } = await supabase.from("lokasi").select("id, nama").order("nama");
    const { data: riwayatData } = await supabase
      .from("transaksi_voucher")
      .select("id, nominal_dibayar, metode, status, kode_voucher, created_at, paket_voucher(nama)")
      .order("created_at", { ascending: false })
      .limit(20);

    setPaketList(paketData ?? []);
    setLokasiList(lokasiData ?? []);
    // Bypass TS error untuk join data
    setRiwayat((riwayatData as unknown as TransaksiVoucher[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleGenerate() {
    if (!selectedPaket || !selectedLokasi) {
      alert("Pilih paket dan lokasi dulu");
      return;
    }
    setGenerating(true);
    setHasilVoucher(null);

    const res = await fetch("/api/billing/generate-voucher-manual", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paketVoucherId: selectedPaket, lokasiId: selectedLokasi, noHpPembeli: noHp || null }),
    });

    const json = await res.json();
    setGenerating(false);

    if (!res.ok) {
      alert(json.message);
      return;
    }

    setHasilVoucher(json);
    setNoHp("");
    loadData();
  }

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Voucher Hotspot</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Generate voucher buat penjualan tunai langsung
      </p>

      <div
        className="p-5 rounded-lg mb-8"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <h3 className="text-sm font-medium mb-3">Generate Voucher Baru</h3>

        <div className="flex gap-3 flex-wrap items-center">
          <select value={selectedLokasi} onChange={(e) => setSelectedLokasi(e.target.value)} style={inputStyle}>
            <option value="">- Pilih Lokasi -</option>
            {lokasiList.map((l) => (
              <option key={l.id} value={l.id}>{l.nama}</option>
            ))}
          </select>

          <select value={selectedPaket} onChange={(e) => setSelectedPaket(e.target.value)} style={inputStyle}>
            <option value="">- Pilih Paket -</option>
            {paketList.map((p) => (
              <option key={p.id} value={p.id}>{p.nama} - Rp {p.harga.toLocaleString("id-ID")}</option>
            ))}
          </select>

          <input
            placeholder="No HP pembeli (opsional)"
            value={noHp}
            onChange={(e) => setNoHp(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--color-accent)" }}
          >
            {generating ? "Memproses..." : "Generate Voucher"}
          </button>
        </div>

        {hasilVoucher && (
          <div
            className="mt-4 p-4 rounded-lg flex items-center justify-between"
            style={{ background: "#DCF5E4", border: "1px solid var(--color-signal-good)" }}
          >
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--color-signal-good)" }}>
                Voucher berhasil dibuat
              </p>
              <p className="mono text-sm">
                {hasilVoucher.username} / {hasilVoucher.password}
              </p>
            </div>
            <button
              onClick={() => router.push(`/struk/${hasilVoucher.strukId}`)}
              className="px-3 py-1.5 rounded text-sm"
              style={{ background: "white", border: "1px solid var(--color-border)" }}
            >
              Lihat/Print Struk
            </button>
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium mb-3">Riwayat Voucher (20 terakhir)</h3>
      <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Paket</th>
              <th>Metode</th>
              <th>Nominal</th>
              <th>Kode Voucher</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {riwayat.map((r) => (
              <tr key={r.id}>
                <td style={{ color: "var(--color-ink-muted)" }}>{new Date(r.created_at).toLocaleString("id-ID")}</td>
                <td>{r.paket_voucher?.nama ?? "-"}</td>
                <td className="capitalize">{r.metode}</td>
                <td>Rp {r.nominal_dibayar.toLocaleString("id-ID")}</td>
                <td className="mono">{r.kode_voucher ?? "-"}</td>
                <td>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: r.status === "lunas" ? "#DCF5E4" : "#FDEEDB",
                      color: r.status === "lunas" ? "#1D8348" : "#B5730B",
                    }}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}