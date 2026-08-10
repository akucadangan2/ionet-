// app/struk/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const NAMA_USAHA = process.env.NEXT_PUBLIC_BUSINESS_NAME || "RTRW Net";

export default function StrukDetailPage() {
  const params = useParams();
  const [struk, setStruk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadStruk() {
      const { data, error } = await supabase
        .from("struk")
        .select(`
          *,
          transaksi_voucher(nominal_dibayar, metode, kode_voucher, dibayar_at, paket_voucher(nama)),
          pembayaran_bulanan(nominal, metode, jumlah_bulan, divalidasi_at, pelanggan(nama))
        `)
        .eq("id", params.id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setStruk(data);
      }
      setLoading(false);
    }
    loadStruk();
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#5B6472", fontFamily: "sans-serif" }}>Memuat struk...</p>
      </div>
    );
  }

  if (notFound || !struk) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#D64545", fontFamily: "sans-serif" }}>Struk tidak ditemukan</p>
      </div>
    );
  }

  const isVoucher = !!struk.transaksi_voucher;
  const detail = isVoucher ? struk.transaksi_voucher : struk.pembayaran_bulanan;

  return (
    <div style={{ minHeight: "100vh", background: "#EDEDEA", padding: "24px 0" }}>
      <style>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          body { background: white !important; margin: 0; }
          .receipt-wrapper { padding: 0 !important; background: white !important; }
          .receipt { box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="receipt-wrapper" style={{ display: "flex", justifyContent: "center" }}>
        <div
          className="receipt"
          style={{
            width: 320,
            background: "white",
            padding: "24px 20px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <p style={{ fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>{NAMA_USAHA.toUpperCase()}</p>
            <p style={{ color: "#5B6472", fontSize: 11 }}>Struk Pembayaran</p>
          </div>

          <div style={{ borderTop: "1px dashed #999", borderBottom: "1px dashed #999", padding: "10px 0", marginBottom: 10 }}>
            <p>No: {struk.nomor_struk}</p>
          </div>

          <div style={{ marginBottom: 10, lineHeight: 1.8 }}>
            {isVoucher ? (
              <>
                <p>Jenis     : Voucher Hotspot</p>
                <p>Paket     : {detail.paket_voucher?.nama}</p>
                <p>Kode      : {detail.kode_voucher}</p>
              </>
            ) : (
              <>
                <p>Jenis     : Langganan Bulanan</p>
                <p>Pelanggan : {detail.pelanggan?.nama}</p>
                <p>Durasi    : {detail.jumlah_bulan} bulan</p>
              </>
            )}
            <p>Metode    : {detail.metode}</p>
            <p>Tanggal   : {new Date(isVoucher ? detail.dibayar_at : detail.divalidasi_at).toLocaleString("id-ID")}</p>
          </div>

          <div style={{ borderTop: "1px dashed #999", paddingTop: 10, marginBottom: 14 }}>
            <p style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14 }}>
              <span>TOTAL</span>
              <span>Rp {(isVoucher ? detail.nominal_dibayar : detail.nominal)?.toLocaleString("id-ID")}</span>
            </p>
          </div>

          <p style={{ textAlign: "center", color: "#5B6472", fontSize: 11 }}>
            -- Terima kasih --
          </p>

          <button
            onClick={() => window.print()}
            className="no-print"
            style={{
              width: "100%",
              marginTop: 20,
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              background: "#E8A33D",
              color: "white",
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Print Struk
          </button>
        </div>
      </div>
    </div>
  );
}