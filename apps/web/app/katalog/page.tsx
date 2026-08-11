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

  function scrollToPaket() {
    var el = document.getElementById("paket");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      <section className="relative overflow-hidden" style={{ background: "var(--color-sidebar)", padding: "80px 24px 100px" }}>
        <NetworkBackground />
        <div className="relative z-10 max-w-4xl mx-auto text-center stagger-1">
          <img src="/logo.png" alt="IONET Plus" style={{ height: 48, margin: "0 auto 32px" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 52px)", color: "white", lineHeight: 1.15, marginBottom: 20 }}>
            Internet Cepat, Stabil,
            <br />
            <span style={{ color: "var(--color-accent)" }}>Untuk Keluarga Anda</span>
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: 17, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.6 }}>
            IONET Plus menyediakan layanan internet rumahan dan voucher hotspot dengan jaringan fiber optik, harga terjangkau, dan dukungan teknis yang cepat tanggap.
          </p>
          <button onClick={scrollToPaket} className="stagger-2 inline-block px-8 py-3 rounded-lg text-sm font-medium text-white transition-transform hover:scale-105" style={{ background: "var(--color-accent)", border: "none", cursor: "pointer" }}>
            Lihat Paket Internet
          </button>
        </div>
      </section>

      <section style={{ padding: "64px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="stagger-2 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(30,136,229,0.1)" }}>
              <Zap size={26} color="var(--color-accent)" />
            </div>
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Fiber Optik</h3>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 14, lineHeight: 1.6 }}>Jaringan fiber optik berkualitas tinggi, minim gangguan cuaca</p>
          </div>
          <div className="stagger-3 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(30,136,229,0.1)" }}>
              <ShieldCheck size={26} color="var(--color-accent)" />
            </div>
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Stabil 24 Jam</h3>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 14, lineHeight: 1.6 }}>Monitoring jaringan real-time, respons cepat kalau ada gangguan</p>
          </div>
          <div className="stagger-4 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(30,136,229,0.1)" }}>
              <Clock size={26} color="var(--color-accent)" />
            </div>
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Support Responsif</h3>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 14, lineHeight: 1.6 }}>Tim teknis siap bantu, laporan gangguan ditangani cepat</p>
          </div>
        </div>
      </section>

      <section id="paket" style={{ padding: "64px 24px", background: "var(--color-surface)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, marginBottom: 12 }}>Paket Langganan Bulanan</h2>
            <p style={{ color: "var(--color-ink-muted)" }}>Pilih paket sesuai kebutuhan, tanpa biaya tersembunyi</p>
          </div>

          {loading === true ? (
            <p className="text-center" style={{ color: "var(--color-ink-muted)" }}>Memuat paket...</p>
          ) : null}

          {loading === false && paketBulanan.length === 0 ? (
            <p className="text-center" style={{ color: "var(--color-ink-muted)" }}>Paket sedang disiapkan, hubungi kami untuk info terbaru</p>
          ) : null}

          {loading === false && paketBulanan.length > 0 ? (
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(" + Math.min(paketBulanan.length, 4) + ", 1fr)" }}>
              {paketBulanan.map(function (p, i) {
                var borderStyle = i === 1 ? "2px solid var(--color-accent)" : "1px solid var(--color-border)";
                var staggerClass = "stagger-" + Math.min(i + 2, 5) + " rounded-xl p-6 text-center transition-transform hover:-translate-y-1";
                return (
                  <div key={p.id} className={staggerClass} style={{ background: "var(--color-bg)", border: borderStyle }}>
                    <Wifi size={28} color="var(--color-accent)" className="mx-auto mb-3" />
                    <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{p.nama}</h3>
                    <p style={{ color: "var(--color-ink-muted)", fontSize: 13, marginBottom: 16 }}>Kecepatan hingga {p.kecepatan}</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700 }}>Rp{Number(p.harga_per_bulan).toLocaleString("id-ID")}</p>
                    <p style={{ color: "var(--color-ink-muted)", fontSize: 13 }}>per bulan</p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section style={{ padding: "64px 24px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 12 }}>Butuh Internet Sementara?</h2>
        <p style={{ color: "var(--color-ink-muted)", lineHeight: 1.7 }}>Selain langganan bulanan, kami juga menyediakan voucher hotspot harian dan mingguan, cocok untuk kos-kosan, warung, atau kebutuhan sementara. Bisa dibeli langsung di lokasi kami.</p>
      </section>

      <footer style={{ background: "var(--color-sidebar)", padding: "48px 24px", color: "#9CA3AF" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <img src="/logo.png" alt="IONET Plus" style={{ height: 32, margin: "0 auto 20px" }} />
          <div className="flex items-center justify-center gap-6 mb-4" style={{ fontSize: 14 }}>
            <span className="flex items-center gap-2">
              <MapPin size={16} />
              Tombariri, Minahasa, Sulawesi Utara
            </span>
            <span className="flex items-center gap-2">
              <Phone size={16} />
              085696951288
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#6B7280" }}>Hak cipta IONET Plus, semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}