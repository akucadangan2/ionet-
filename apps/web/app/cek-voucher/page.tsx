"use client";

import { useState } from "react";
import { Search, Copy, Check, Loader2 } from "lucide-react";

interface RiwayatItem {
  kodeVoucher: string;
  paketNama: string;
  dibayarAt: string;
}

export default function CekVoucherPage() {
  const [noHp, setNoHp] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([]);
  const [copiedKode, setCopiedKode] = useState<string | null>(null);

  async function handleCari() {
    if (!noHp) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/checkout/riwayat?noHp=" + encodeURIComponent(noHp));
      const json = await res.json();
      setRiwayat(json.riwayat || []);
    } catch (err) {
      setRiwayat([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(kode: string) {
    const kodeAsli = kode.split("/")[0];
    navigator.clipboard.writeText(kodeAsli);
    setCopiedKode(kode);
    setTimeout(function () { setCopiedKode(null); }, 2000);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", padding: "40px 20px" }}>
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        <img src="/logo.png" alt="IONET Plus" style={{ height: 40, margin: "0 auto 24px", display: "block" }} />
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, textAlign: "center", marginBottom: 8 }}>
          Cek Voucher Saya
        </h1>
        <p style={{ textAlign: "center", color: "var(--color-ink-muted)", fontSize: 13, marginBottom: 24 }}>
          Masukkan nomor HP yang dipakai saat beli voucher
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <input
            value={noHp}
            onChange={function (e) { setNoHp(e.target.value); }}
            onKeyDown={function (e) { if (e.key === "Enter") handleCari(); }}
            placeholder="08xxxxxxxxxx"
            style={{ flex: 1, border: "1px solid var(--color-border)", borderRadius: 8, padding: "12px 14px" }}
          />
          <button
            onClick={handleCari}
            disabled={loading || !noHp}
            style={{
              background: "var(--color-accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "0 18px",
              opacity: loading || !noHp ? 0.6 : 1,
            }}
          >
            {loading ? <Loader2 size={18} className="spinner" /> : <Search size={18} />}
          </button>
        </div>

        {searched && !loading && riwayat.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--color-ink-muted)", fontSize: 13 }}>
            Tidak ada voucher ditemukan untuk nomor ini
          </p>
        )}

        {riwayat.map(function (r, i) {
          const kodeAsli = r.kodeVoucher.split("/")[0];
          return (
            <div
              key={i}
              style={{
                background: "white",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>{r.paketNama}</span>
                <span style={{ fontSize: 11, color: "var(--color-ink-muted)" }}>
                  {new Date(r.dibayarAt).toLocaleDateString("id-ID")}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
                  {kodeAsli}
                </span>
                <button
                  onClick={function () { handleCopy(r.kodeVoucher); }}
                  style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: 6, padding: 8 }}
                >
                  {copiedKode === r.kodeVoucher ? <Check size={16} color="var(--color-signal-good)" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}