"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Wifi, CheckCircle, Loader2 } from "lucide-react";

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

  var parts = kodeVoucher ? kodeVoucher.split("/") : [];
  var username = parts[0];
  var password = parts[1];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div
        className="stagger-1"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: 32,
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <img src="/logo.png" alt="IONET Plus" style={{ height: 36, margin: "0 auto 24px" }} />

        {status === "lunas" && kodeVoucher ? (
          <div>
            <CheckCircle size={48} color="var(--color-signal-good)" style={{ margin: "0 auto 16px" }} />
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 4 }}>
              Pembayaran Berhasil!
            </h1>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 14, marginBottom: 24 }}>
              {paketNama ? "Paket " + paketNama : "Voucher kamu sudah aktif"}
            </p>

            <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: 20, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Wifi size={18} color="var(--color-accent)" />
                <span style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>Detail Voucher WiFi</span>
              </div>
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: "var(--color-ink-muted)", marginBottom: 2 }}>Username</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600 }}>{username}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: "var(--color-ink-muted)", marginBottom: 2 }}>Password</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600 }}>{password}</p>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "var(--color-ink-muted)", marginTop: 16 }}>
              Masukkan username &amp; password di atas saat WiFi meminta login hotspot
            </p>
          </div>
        ) : (
          <div>
            <Loader2 size={40} color="var(--color-accent)" className="spinner" style={{ margin: "0 auto 16px" }} />
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 8 }}>
              Memproses Pembayaran...
            </h1>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 14 }}>
              {attempts > 6
                ? "Sedikit lebih lama dari biasanya, mohon tunggu sebentar lagi"
                : "Mohon tunggu, ini biasanya cuma butuh beberapa detik"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}