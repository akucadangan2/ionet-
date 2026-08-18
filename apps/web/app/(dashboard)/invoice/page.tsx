"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface InvoiceItem {
  nama: string;
  qty: number;
  harga: number;
}

interface InvoiceData {
  invoiceNumber: string;
  tanggal: string;
  namaPelanggan: string;
  alamatPelanggan?: string;
  items: InvoiceItem[];
  total: number;
  metode: string;
  status: string;
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function InvoiceContent() {
  const searchParams = useSearchParams();
  const tipe = searchParams.get("tipe");
  const id = searchParams.get("id");

  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(function () {
    if (!tipe || !id) return;
    async function load() {
      try {
        const res = await fetch("/api/invoice?tipe=" + tipe + "&id=" + id);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        setData(json);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tipe, id]);

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat invoice...</p>;
  if (error) return <p style={{ color: "var(--color-signal-bad)" }}>{error}</p>;
  if (!data) return null;

  return (
    <div>
      <div className="no-print mb-4">
        <button
          onClick={function () { window.print(); }}
          className="px-5 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--color-accent)", border: "none" }}
        >
          Cetak / Simpan PDF
        </button>
      </div>

      <div id="invoice-print-area" style={{ background: "white", maxWidth: 700, margin: "0 auto", padding: 40, border: "1px solid #e5e5e5" }}>
        <div className="flex items-center justify-between mb-8" style={{ borderBottom: "2px solid #1E88E5", paddingBottom: 20 }}>
          <div>
            <img src="/logo.png" alt="IONET Plus" style={{ height: 36, marginBottom: 8 }} />
            <p style={{ fontSize: 12, color: "#666" }}>Tombariri, Minahasa, Sulawesi Utara</p>
            <p style={{ fontSize: 12, color: "#666" }}>CS: 085696951288</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1E88E5" }}>INVOICE</h1>
            <p style={{ fontSize: 13, color: "#666" }}>{data.invoiceNumber}</p>
          </div>
        </div>

        <div className="flex justify-between mb-8">
          <div>
            <p style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>DITAGIHKAN KEPADA</p>
            <p style={{ fontSize: 14, fontWeight: 600 }}>{data.namaPelanggan}</p>
            {data.alamatPelanggan && <p style={{ fontSize: 12, color: "#666" }}>{data.alamatPelanggan}</p>}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>TANGGAL</p>
            <p style={{ fontSize: 13 }}>
              {data.tanggal ? new Date(data.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
            </p>
            <p style={{ fontSize: 11, color: "#999", marginTop: 8, marginBottom: 2 }}>STATUS</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: data.status === "lunas" ? "#2FAE60" : "#E8A33D" }}>
              {data.status.toUpperCase()}
            </p>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ddd", background: "#f9f9f9" }}>
              <th style={{ textAlign: "left", padding: "8px 4px", fontSize: 12, color: "#666" }}>Deskripsi</th>
              <th style={{ textAlign: "center", padding: "8px 4px", fontSize: 12, color: "#666" }}>Qty</th>
              <th style={{ textAlign: "right", padding: "8px 4px", fontSize: 12, color: "#666" }}>Harga</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map(function (item, i) {
              return (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px 4px", fontSize: 13 }}>{item.nama}</td>
                  <td style={{ padding: "10px 4px", fontSize: 13, textAlign: "center" }}>{item.qty}</td>
                  <td style={{ padding: "10px 4px", fontSize: 13, textAlign: "right" }}>{formatRupiah(item.harga)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div style={{ width: 220 }}>
            <div className="flex justify-between" style={{ padding: "8px 0", borderTop: "2px solid #1E88E5" }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#1E88E5" }}>{formatRupiah(data.total)}</span>
            </div>
            <p style={{ fontSize: 11, color: "#999", marginTop: 4 }}>Metode: {data.metode}</p>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "#999", borderTop: "1px solid #eee", paddingTop: 16 }}>
          Terima kasih telah menggunakan layanan IONET+
        </div>
      </div>

    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div />}>
      <InvoiceContent />
    </Suspense>
  );
}