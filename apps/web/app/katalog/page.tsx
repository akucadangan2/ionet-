"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import NetworkBackground from "@/components/NetworkBackground";
import { Wifi, Zap, ShieldCheck, Clock, MapPin, Phone } from "lucide-react";

interface PaketBulanan {
  id: string;
  nama: string;
  kecepatan_mbps: number;
  harga_per_bulan: number;
}

export default function KatalogPage() {
  const [paketBulanan, setPaketBulanan] = useState<PaketBulanan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("paket_bulanan")
        .select("id, nama, kecepatan_mbps, harga_per_bulan")
        .order("harga_per_bulan");
      setPaketBulanan(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--color-sidebar)", padding: "80px 24px 100px" }}
      >
        <NetworkBackground />
        <div className="relative z-10 max-w-4xl mx-auto text-center stagger-1">
          <img src="/logo.png" alt="IONET+" style={{ height: 48, margin: "0 auto 32px" }} />
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 5vw, 52px)",
              color: "white",
              lineHeight: 1.15,
              marginBottom: 20,
            }}
          >
            Internet Cepat, Stabil, <br />
            <span style={{ color: "var(--color-accent)" }}>Untuk Keluarga Anda</span>
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: 17, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.6 }}>
            IONET+ menyediakan layanan internet rumahan dan voucher hotspot dengan
            jaringan fiber optik, harga terjangkau, dan dukungan teknis yang cepat tanggap.
          </p>
          
          {/* Tag pembuka <a> yang sebelumnya hilang ditambahkan di sini */}
          <a
            href="#paket"
            className="stagger-2 inline-block px-8 py-3 rounded-lg text-sm font-medium text-white transition-transform hover:scale-105"
            style={{ background: "var(--color-accent)" }}
          >
            Lihat Paket Internet
          </a>
        </div>
      </section>

      {/* Fitur unggulan */}
      <section style={{ padding: "64px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: "Fiber Optik", desc: "Jaringan fiber optik berkualitas tinggi, minim gangguan cuaca" },
            { icon: ShieldCheck, title: "Stabil 24 Jam", desc: "Monitoring jaringan real-time, respons cepat kalau ada gangguan" },
            { icon: Clock, title: "Support Responsif", desc: "Tim teknis siap bantu, laporan gangguan ditangani cepat" },
          ].map((f, i) => (
            <div key={f.title} className={`stagger-${i + 2} text-center`}>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(30,136,229,0.1)" }}
              >
                <f.icon size={26} color="var(--color-accent)" />
              </div>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: "var(--color-ink-muted)", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Paket harga */}
      <section id="paket" style={{ padding: "64px 24px", background: "var(--color-surface)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, marginBottom: 12 }}>
              Paket Langganan Bulanan
            </h2>
            <p style={{ color: "var(--color-ink-muted)" }}>
              Pilih paket sesuai kebutuhan, tanpa biaya tersembunyi
            </p>
          </div>

          {loading ? (
            <p className="text-center" style={{ color: "var(--color-ink-muted)" }}>Memuat paket...</p>
          ) : paketBulanan.length === 0 ? (
            <p className="text-center" style={{ color: "var(--color-ink-muted)" }}>
              Paket sedang disiapkan, hubungi kami untuk info terbaru
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" style={{ gridTemplateColumns: `repeat(${Math.min(paketBulanan.length, 4)}, minmax(0, 1fr))` }}>
              {paketBulanan.map((p, i) => (
                <div
                  key={p.id}
                  className={`stagger-${Math.min(i + 2, 5)} rounded-xl p-6 text-center transition-transform hover:-translate-y-1`}
                  style={{
                    background: "var(--color-bg)",
                    border: i === 1 ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                  }}
                >
                  <Wifi size={28} color="var(--color-accent)" className="mx-auto mb-3" />
                  <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{p.nama}</h3>
                  <p style={{ color: "var(--color-ink-muted)", fontSize: 13, marginBottom: 16 }}>
                    Kecepatan hingga {p.kecepatan_mbps} Mbps
                  </p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700 }}>
                    Rp{p.harga_per_bulan.toLocaleString("id-ID")}
                  </p>
                  <p style={{ color: "var(--color-ink-muted)", fontSize: 13 }}>/bulan</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Voucher hotspot */}
      <section style={{ padding: "64px 24px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 12 }}>
          Butuh Internet Sementara?
        </h2>
        <p style={{ color: "var(--color-ink-muted)", lineHeight: 1.7 }}>
          Selain langganan bulanan, kami juga menyediakan voucher hotspot harian dan
          mingguan — cocok untuk kos-kosan, warung, atau kebutuhan sementara. Bisa dibeli
          langsung di lokasi kami.
        </p>
      </section>

      {/* Footer / kontak */}
      <footer style={{ background: "var(--color-sidebar)", padding: "48px 24px", color: "#9CA3AF" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <img src="/logo.png" alt="IONET+" style={{ height: 32, margin: "0 auto 20px" }} />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-4" style={{ fontSize: 14 }}>
            <span className="flex items-center gap-2">
              <MapPin size={16} /> Tombariri, Minahasa, Sulawesi Utara
            </span>
            <span className="flex items-center gap-2">
              <Phone size={16} /> 085696951288
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#6B7280" }}>© {new Date().getFullYear()} IONET+. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}