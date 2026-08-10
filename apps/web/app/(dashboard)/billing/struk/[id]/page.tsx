// app/(dashboard)/billing/struk/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function StrukDetailPage() {
  const params = useParams();
  const [struk, setStruk] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStruk() {
      const { data } = await supabase
        .from("struk")
        .select(`
          *,
          transaksi_voucher(nominal_dibayar, metode, kode_voucher, dibayar_at, paket_voucher(nama)),
          pembayaran_bulanan(nominal, metode, jumlah_bulan, divalidasi_at, pelanggan(nama))
        `)
        .eq("id", params.id)
        .single();

      setStruk(data);
      setLoading(false);
    }
    loadStruk();
  }, [params.id]);

  if (loading) return <p>Memuat struk...</p>;
  if (!struk) return <p>Struk tidak ditemukan</p>;

  const isVoucher = !!struk.transaksi_voucher;
  const detail = isVoucher ? struk.transaksi_voucher : struk.pembayaran_bulanan;

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", fontFamily: "monospace" }}>
      <style>{`
        @media print {
          nav, header, .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>

      <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: 10 }}>
        <h2>STRUK PEMBAYARAN</h2>
        <p>{struk.nomor_struk}</p>
      </div>

      <div style={{ padding: "10px 0", borderBottom: "1px dashed #000" }}>
        {isVoucher ? (
          <>
            <p>Jenis: Voucher Hotspot</p>
            <p>Paket: {detail.paket_voucher?.nama}</p>
            <p>Kode Voucher: {detail.kode_voucher}</p>
          </>
        ) : (
          <>
            <p>Jenis: Langganan Bulanan</p>
            <p>Pelanggan: {detail.pelanggan?.nama}</p>
            <p>Jumlah Bulan: {detail.jumlah_bulan}</p>
          </>
        )}
        <p>Metode: {detail.metode}</p>
        <p>Nominal: Rp {(isVoucher ? detail.nominal_dibayar : detail.nominal)?.toLocaleString("id-ID")}</p>
        <p>Tanggal: {new Date(isVoucher ? detail.dibayar_at : detail.divalidasi_at).toLocaleString("id-ID")}</p>
      </div>

      <div style={{ textAlign: "center", paddingTop: 10 }}>
        <p>Terima kasih</p>
      </div>

      <button className="no-print" onClick={() => window.print()} style={{ width: "100%", marginTop: 20 }}>
        Print Struk
      </button>
    </div>
  );
}