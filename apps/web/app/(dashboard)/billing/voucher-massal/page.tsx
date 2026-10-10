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

const VOUCHER_PER_HALAMAN = 25;

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

  // Pecah hasil jadi per-halaman, masing-masing max 25 voucher (5 kolom x 5 baris) biar pas 1 lembar A4
  const halamanList: GeneratedVoucher[][] = [];
  for (let i = 0; i < hasil.length; i += VOUCHER_PER_HALAMAN) {
    halamanList.push(hasil.slice(i, i + VOUCHER_PER_HALAMAN));
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
            Cetak {hasil.length} Voucher ({halamanList.length} lembar A4)
          </button>
        )}
      </div>

      {halamanList.map(function (halaman, halamanIndex) {
        return (
          <div key={halamanIndex} className="voucher-page">
            <div className="voucher-print-grid">
              {halaman.map(function (v, i) {
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
          </div>
        );
      })}

      <style jsx global>{`
        @page {
          margin: 8mm;
        }
        .voucher-page {
          width: 100%;
        }
        .voucher-print-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          grid-auto-rows: 1fr;
          gap: 6px;
        }
        .voucher-card {
          border: 1px dashed #999;
          border-radius: 6px;
          padding: 6px;
          background: white;
          display: flex;
          flex-direction: column;
        }
        .voucher-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .voucher-card-logo {
          font-weight: 700;
          font-size: 9px;
          color: #1e88e5;
        }
        .voucher-card-harga {
          font-weight: 700;
          font-size: 10px;
        }
        .voucher-card-label {
          font-size: 7px;
          color: #666;
          margin-bottom: 1px;
        }
        .voucher-card-kode {
          font-family: monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .voucher-card-info {
          font-size: 6.5px;
          color: #666;
          margin: 1px 0;
        }
        .voucher-card-cs {
          font-size: 6.5px;
          font-weight: 600;
          margin-top: 3px;
        }
        @media screen {
          .voucher-page {
            max-width: 210mm;
            margin: 0 auto 24px auto;
            padding: 8mm;
            background: #fff;
            border: 1px solid var(--color-border);
          }
        }
        @media print {
          .no-print,
          #dashboard-topnav {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          .voucher-page {
            width: 100%;
            height: 281mm;
            page-break-after: always;
          }
          .voucher-page:last-child {
            page-break-after: auto;
          }
          .voucher-print-grid {
            grid-template-columns: repeat(5, 1fr);
            grid-template-rows: repeat(5, 1fr);
            height: 100%;
          }
          .voucher-card {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}