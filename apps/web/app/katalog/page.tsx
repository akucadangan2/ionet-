"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import NetworkBackground from "@/components/NetworkBackground";
import { Wifi, Zap, ShieldCheck, Clock, MapPin, Phone } from "lucide-react";

interface PaketBulanan {
  id: string;
  nama: string;
  kecepatan: string;
  harga_per_bulan: number;
}

interface PaketVoucher {
  id: string;
  nama: string;
  harga: number;
  durasi_menit: number;
}

const inputStyle = {
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  padding: "13px 14px",
  fontSize: 16, // wajib >=16px biar Safari/iOS gak auto-zoom pas fokus ke input
  width: "100%",
  boxSizing: "border-box" as const,
};

function VoucherSection() {
  const [paketList, setPaketList] = useState<PaketVoucher[]>([]);
  const [selectedPaket, setSelectedPaket] = useState("");
  const [noHp, setNoHp] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(function () {
    async function load() {
      const result = await supabase
        .from("paket_voucher")
        .select("id, nama, harga, durasi_menit")
        .order("harga");
      setPaketList(result.data || []);
      if (result.data && result.data.length > 0) setSelectedPaket(result.data[0].id);
      setLoading(false);
    }
    load();
  }, []);

  async function handleBeli() {
    setErrorMsg("");
    if (!selectedPaket || !noHp) {
      setErrorMsg("Pilih paket dan isi nomor HP dulu");
      return;
    }
    setProcessing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(function () { controller.abort(); }, 20000); // 20 detik max
    try {
      const res = await fetch("/api/checkout/voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paketVoucherId: selectedPaket, noHpPembeli: noHp }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const json = await res.json();
      if (!res.ok || !json.paymentUrl) {
        throw new Error(json.message || "Gagal memproses pembayaran");
      }
      window.location.href = json.paymentUrl;
    } catch (err) {
      clearTimeout(timeoutId);
      if ((err as Error).name === "AbortError") {
        setErrorMsg("Koneksi lambat, server tidak merespons dalam 20 detik. Coba lagi.");
      } else {
        setErrorMsg((err as Error).message);
      }
      setProcessing(false);
    }
  }

  return (
    <section id="beli-voucher" style={{ padding: "32px 16px 110px", maxWidth: 480, margin: "0 auto" }}>
      <div className="text-center mb-6">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 6vw, 28px)", marginBottom: 8 }}>
          Butuh Internet Sementara?
        </h2>
        <p style={{ color: "var(--color-ink-muted)", lineHeight: 1.6, fontSize: 14 }}>
          Beli voucher hotspot langsung dari sini, bayar pakai QRIS
        </p>
      </div>

      {loading ? (
        <p className="text-center" style={{ color: "var(--color-ink-muted)" }}>Memuat paket...</p>
      ) : (
        <div className="rounded-xl p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-ink-muted)" }}>
            Pilih Paket
          </label>
          <select
            value={selectedPaket}
            onChange={function (e) { setSelectedPaket(e.target.value); }}
            className="mb-4"
            style={inputStyle}
          >
            {paketList.map(function (p) {
              return (
                <option key={p.id} value={p.id}>
                  {p.nama} - Rp{Number(p.harga).toLocaleString("id-ID")}
                </option>
              );
            })}
          </select>

          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-ink-muted)" }}>
            Nomor HP (untuk kirim voucher)
          </label>
          <input
            value={noHp}
            onChange={function (e) { setNoHp(e.target.value); }}
            placeholder="08xxxxxxxxxx"
            inputMode="numeric"
            className="mb-4"
            style={inputStyle}
          />

          {errorMsg && (
            <p className="text-sm mb-4" style={{ color: "var(--color-signal-bad)" }}>{errorMsg}</p>
          )}

          <button
            onClick={handleBeli}
            disabled={processing}
            className="w-full font-medium text-white"
            style={{
              background: "var(--color-accent)",
              border: "none",
              borderRadius: 10,
              padding: "15px 0",
              fontSize: 15,
              minHeight: 50,
              opacity: processing ? 0.6 : 1,
            }}
          >
            {processing ? "Memproses..." : "Bayar dengan QRIS"}
          </button>
        </div>
      )}
    </section>
  );
}

export default function KatalogPage() {
  const [paketBulanan, setPaketBulanan] = useState<PaketBulanan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await supabase
          .from("paket_bulanan")
          .select("id, nama, kecepatan, harga_per_bulan")
          .order("harga_per_bulan");
        if (result.error) {
          console.error("Error ambil paket:", result.error);
        }
        setPaketBulanan(result.data || []);
      } catch (err) {
        console.error("Exception ambil paket:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Langsung scroll ke bagian beli voucher pas halaman dibuka - ini pintu masuk utama
  // buat user dari captive portal hotspot, jadi mereka gak perlu scroll manual lewatin hero/fitur
  useEffect(function () {
    var timer = setTimeout(function () {
      var el = document.getElementById("beli-voucher");
      if (el) {
        el.scrollIntoView({ behavior: "auto" });
      }
    }, 100);
    return function () { clearTimeout(timer); };
  }, []);

  function scrollToPaket() {
    var el = document.getElementById("paket");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  function scrollToBeliVoucher() {
    var el = document.getElementById("beli-voucher");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      <section className="relative overflow-hidden" style={{ background: "var(--color-sidebar)", padding: "clamp(48px, 12vw, 80px) 20px clamp(56px, 14vw, 100px)" }}>
        <NetworkBackground />
        <div className="relative z-10 max-w-4xl mx-auto text-center stagger-1">
          <img src="/logo.png" alt="IONET Plus" style={{ height: 40, margin: "0 auto 24px" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 8vw, 52px)", color: "white", lineHeight: 1.15, marginBottom: 16 }}>
            Internet Cepat, Stabil,
            <br />
            <span style={{ color: "var(--color-accent)" }}>Untuk Keluarga Anda</span>
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: 15, maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.6, padding: "0 8px" }}>
            IONET Plus menyediakan layanan internet rumahan dan voucher hotspot dengan jaringan fiber optik, harga terjangkau, dan dukungan teknis yang cepat tanggap.
          </p>
          <button onClick={scrollToPaket} className="stagger-2 inline-block px-7 py-3 rounded-lg text-sm font-medium text-white transition-transform hover:scale-105" style={{ background: "var(--color-accent)", border: "none", cursor: "pointer", minHeight: 46 }}>
            Lihat Paket Internet
          </button>
        </div>
      </section>

      <section style={{ padding: "36px 16px", maxWidth: 1000, margin: "0 auto" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="stagger-2 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(30,136,229,0.1)" }}>
              <Zap size={22} color="var(--color-accent)" />
            </div>
            <h3 style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>Fiber Optik</h3>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 13, lineHeight: 1.6 }}>Jaringan fiber optik berkualitas tinggi, minim gangguan cuaca</p>
          </div>
          <div className="stagger-3 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(30,136,229,0.1)" }}>
              <ShieldCheck size={22} color="var(--color-accent)" />
            </div>
            <h3 style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>Stabil 24 Jam</h3>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 13, lineHeight: 1.6 }}>Monitoring jaringan real-time, respons cepat kalau ada gangguan</p>
          </div>
          <div className="stagger-4 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(30,136,229,0.1)" }}>
              <Clock size={22} color="var(--color-accent)" />
            </div>
            <h3 style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>Support Responsif</h3>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 13, lineHeight: 1.6 }}>Tim teknis siap bantu, laporan gangguan ditangani cepat</p>
          </div>
        </div>
      </section>

      <section id="paket" style={{ padding: "36px 16px", background: "var(--color-surface)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="text-center mb-8">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 6vw, 32px)", marginBottom: 8 }}>Paket Langganan Bulanan</h2>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 14 }}>Pilih paket sesuai kebutuhan, tanpa biaya tersembunyi</p>
          </div>

          {loading === true ? (
            <p className="text-center" style={{ color: "var(--color-ink-muted)" }}>Memuat paket...</p>
          ) : null}

          {loading === false && paketBulanan.length === 0 ? (
            <p className="text-center" style={{ color: "var(--color-ink-muted)" }}>Paket sedang disiapkan, hubungi kami untuk info terbaru</p>
          ) : null}

          {loading === false && paketBulanan.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {paketBulanan.map(function (p, i) {
                var borderStyle = i === 1 ? "2px solid var(--color-accent)" : "1px solid var(--color-border)";
                var staggerClass = "stagger-" + Math.min(i + 2, 5) + " rounded-xl p-5 text-center transition-transform hover:-translate-y-1";
                return (
                  <div key={p.id} className={staggerClass} style={{ background: "var(--color-bg)", border: borderStyle }}>
                    <Wifi size={24} color="var(--color-accent)" className="mx-auto mb-3" />
                    <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{p.nama}</h3>
                    <p style={{ color: "var(--color-ink-muted)", fontSize: 13, marginBottom: 14 }}>Kecepatan hingga {p.kecepatan}</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700 }}>Rp{Number(p.harga_per_bulan).toLocaleString("id-ID")}</p>
                    <p style={{ color: "var(--color-ink-muted)", fontSize: 12 }}>per bulan</p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <VoucherSection />

      <button
        onClick={scrollToBeliVoucher}
        style={{
          position: "fixed",
          bottom: "calc(16px + env(safe-area-inset-bottom))",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--color-accent)",
          color: "white",
          border: "none",
          borderRadius: 30,
          padding: "13px 24px",
          fontSize: 13,
          fontWeight: 600,
          minHeight: 44,
          boxShadow: "0 4px 20px rgba(30,136,229,0.4)",
          cursor: "pointer",
          zIndex: 50,
          maxWidth: "calc(100vw - 32px)",
        }}
      >
        Beli Voucher Sekarang
      </button>

      <footer style={{ background: "var(--color-sidebar)", padding: "40px 20px 90px", color: "#9CA3AF" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <img src="/logo.png" alt="IONET Plus" style={{ height: 28, margin: "0 auto 16px" }} />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-4" style={{ fontSize: 13 }}>
            <span className="flex items-center gap-2">
              <MapPin size={15} />
              Tombariri, Minahasa, Sulawesi Utara
            </span>
            <span className="flex items-center gap-2">
              <Phone size={15} />
              085696951288
            </span>
          </div>
          <p style={{ fontSize: 11, color: "#6B7280" }}>Hak cipta IONET Plus, semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}