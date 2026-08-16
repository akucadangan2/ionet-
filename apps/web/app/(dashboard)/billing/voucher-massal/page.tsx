"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface PaketVoucher {
  id: string;
  nama: string;
  harga: number;
}

interface RouterItem {
  id: string;
  nama: string;
}

interface GeneratedVoucher {
  kode: string;
  paketNama: string;
  harga: number;
}

export default function VoucherMassalPage() {
  const [paketList, setPaketList] = useState<PaketVoucher[]>([]);
  const [routerList, setRouterList] = useState<RouterItem[]>([]);
  const [selectedPaket, setSelectedPaket] = useState("");
  const [selectedRouter, setSelectedRouter] = useState("");
  const [jumlah, setJumlah] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<GeneratedVoucher[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(function () {
    async function load() {
      const paketResult = await supabase.from("paket_voucher").select("id, nama, harga").order("harga");
      const routerResult = await supabase.from("router").select("id, nama");
      setPaketList(paketResult.data || []);
      setRouterList(routerResult.data || []);
      if (paketResult.data && paketResult.data.length > 0) setSelectedPaket(paketResult.data[0].id);
      if (routerResult.data && routerResult.data.length > 0) setSelectedRouter(routerResult.data[0].id);
    }
    load();
  }, []);

  async function handleGenerate() {
    setErrorMsg("");
    setHasil([]);
    if (!selectedPaket || !selectedRouter || jumlah < 1) {
      setErrorMsg("Lengkapi semua field dulu");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/billing/generate-voucher-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routerId: selectedRouter, paketVoucherId: selectedPaket, jumlah: jumlah }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal generate voucher");
      setHasil(json.generated || []);
      if (json.errors && json.errors.length > 0) {
        setErrorMsg(json.errors.length + " voucher gagal dibuat, cek console untuk detail");
        console.error("Errors:", json.errors);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <div className="no-print">
        <h1 className="text-2xl font-semibold mb-1">Generate Voucher Massal</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
          Buat banyak voucher sekaligus untuk dicetak dan dijual fisik
        </p>

        <div
          className="rounded-lg p-6 mb-6"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", maxWidth: 500 }}
        >
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-ink-muted)" }}>
            Router
          </label>
          <select
            value={selectedRouter}
            onChange={function (e) { setSelectedRouter(e.target.value); }}
            className="w-full mb-4"
            style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" }}
          >
            {routerList.map(function (r) {
              return <option key={r.id} value={r.id}>{r.nama}</option>;
            })}
          </select>

          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-ink-muted)" }}>
            Paket Voucher
          </label>
          <select
            value={selectedPaket}
            onChange={function (e) { setSelectedPaket(e.target.value); }}
            className="w-full mb-4"
            style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" }}
          >
            {paketList.map(function (p) {
              return <option key={p.id} value={p.id}>{p.nama} - Rp{Number(p.harga).toLocaleString("id-ID")}</option>;
            })}
          </select>

          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-ink-muted)" }}>
            Jumlah Voucher (max 100)
          </label>
          <input
            type="number"
            value={jumlah}
            onChange={function (e) { setJumlah(Number(e.target.value)); }}
            min={1}
            max={100}
            className="w-full mb-4"
            style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" }}
          />

          {errorMsg && <p className="text-sm mb-4" style={{ color: "var(--color-signal-bad)" }}>{errorMsg}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--color-accent)", border: "none", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Membuat voucher..." : "Generate Voucher"}
          </button>
        </div>

        {hasil.length > 0 && (
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white mb-6"
            style={{ background: "var(--color-signal-good)", border: "none" }}
          >
            Cetak {hasil.length} Voucher
          </button>
        )}
      </div>

      {hasil.length > 0 && (
        <div className="voucher-print-grid">
          {hasil.map(function (v, i) {
            return (
              <div key={i} className="voucher-card">
                <div className="voucher-card-header">
                  <span className="voucher-card-logo">IONET+</span>
                  <span className="voucher-card-harga">Rp{v.harga.toLocaleString("id-ID")}</span>
                </div>
                <p className="voucher-card-label">VOUCHER</p>
                <p className="voucher-card-kode">{v.kode}</p>
                <p className="voucher-card-info">Hubungkan ke WiFi ion.net</p>
                <p className="voucher-card-info">Buka browser, ketik: ion.net</p>
                <p className="voucher-card-cs">CS: 085696951288</p>
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        .voucher-print-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .voucher-card {
          border: 1px dashed #999;
          border-radius: 8px;
          padding: 12px;
          background: white;
        }
        .voucher-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .voucher-card-logo {
          font-weight: 700;
          font-size: 13px;
          color: #1e88e5;
        }
        .voucher-card-harga {
          font-weight: 700;
          font-size: 15px;
        }
        .voucher-card-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 2px;
        }
        .voucher-card-kode {
          font-family: monospace;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .voucher-card-info {
          font-size: 10px;
          color: #666;
          margin: 2px 0;
        }
        .voucher-card-cs {
          font-size: 10px;
          font-weight: 600;
          margin-top: 6px;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .voucher-print-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .voucher-card {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}