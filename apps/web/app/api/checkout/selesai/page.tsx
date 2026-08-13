"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Wifi, Loader2, Phone } from "lucide-react";

export default function CheckoutSelesaiPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  const [status, setStatus] = useState("pending");
  const [kodeVoucher, setKodeVoucher] = useState<string | null>(null);
  const [paketNama, setPaketNama] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(function () {
    if (!orderId) return;

    var intervalId = setInterval(function () {
      fetch("/api/checkout/status?id=" + orderId)
        .then(function (res) { return res.json(); })
        .then(function (json) {
          setStatus(json.status);
          setKodeVoucher(json.kodeVoucher);
          setPaketNama(json.paketNama);
          setAttempts(function (a) { return a + 1; });
        })
        .catch(function () {
          setAttempts(function (a) { return a + 1; });
        });
    }, 3000);

    return function () { clearInterval(intervalId); };
  }, [orderId]);

  if (!orderId) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-ink-muted)" }}>Order tidak ditemukan</p>
      </div>
    );
  }

  var kode = kodeVoucher ? kodeVoucher.split("/")[0] : "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      {status === "lunas" && kode ? (
        <div
          className="stagger-1"
          style={{
            background: "white",
            borderRadius: 16,
            overflow: "hidden",
            maxWidth: 360,
            width: "100%",
            boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ padding: "24px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <img src="/logo.png" alt="IONET Plus" style={{ height: 28 }} />
            {paketNama && (
              <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--color-accent)" }}>
                {paketNama}
              </span>
            )}
          </div>

          <div style={{ padding: "0 24px 20px" }}>
            <p style={{ fontSize: 12, color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Kode Voucher
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: 4,
                color: "var(--color-ink)",
              }}
            >
              {kode}
            </p>
          </div>

          <div style={{ background: "var(--color-bg)", padding: "16px 24px", fontSize: 13, color: "var(--color-ink-muted)", lineHeight: 1.7 }}>
            <p>Hubungkan ke WiFi <b>ion.net</b></p>
            <p>Buka browser, ketik: <b>ion.net</b></p>
            <p>Masukkan kode voucher di atas</p>
          </div>

          <div style={{ background: "var(--color-sidebar)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 8, color: "white", fontSize: 13 }}>
            <Phone size={14} />
            CS: 085696951288
          </div>
        </div>
      ) : (
        <div
          className="stagger-1"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: 32,
            maxWidth: 360,
            width: "100%",
            textAlign: "center",
          }}
        >
          <img src="/logo.png" alt="IONET Plus" style={{ height: 32, margin: "0 auto 24px" }} />
          <Loader2 size={40} color="var(--color-accent)" className="spinner" style={{ margin: "0 auto 16px" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 8 }}>
            Memproses Pembayaran...
          </h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 13 }}>
            {attempts > 6 ? "Sedikit lebih lama dari biasanya, mohon tunggu" : "Mohon tunggu sebentar"}
          </p>
        </div>
      )}
    </div>
  );
}