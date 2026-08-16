// app/(dashboard)/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import SignalIndicator from "@/components/SignalIndicator";
import {
  Users,
  Wallet,
  AlertTriangle,
  Wifi,
  Ticket,
  CreditCard,
  Package,
  FileSpreadsheet,
  Map,
  Gauge,
  Radio,
  Server,
  MapPin,
  UserCog,
  Zap,
} from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

function formatTanggal() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const menuGroups = [
  {
    label: "Billing",
    items: [
      { href: "/billing/voucher", label: "Voucher", icon: Ticket },
      { href: "/billing/hotspot-aktif", label: "Hotspot Aktif", icon: Wifi },
      { href: "/billing/langganan-bulanan", label: "Langganan Bulanan", icon: CreditCard },
      { href: "/billing/paket", label: "Paket Harga", icon: Package },
      { href: "/billing/laporan-keuangan", label: "Laporan Keuangan", icon: FileSpreadsheet },
      { href: "/billing/buku-kas", label: "Buku Kas", icon: Wallet },
    ],
  },
  {
    label: "Jaringan",
    items: [
      { href: "/jaringan/peta", label: "Peta Jaringan", icon: Map },
      { href: "/jaringan/odc-odp", label: "Titik ODC/ODP", icon: MapPin },
      { href: "/jaringan/bandwidth", label: "Bandwidth", icon: Gauge },
      { href: "/jaringan/uplink-monitoring", label: "Monitoring Uplink", icon: Radio },
      { href: "/jaringan/radius", label: "RADIUS", icon: Server },
      { href: "/jaringan/sinyal-olt", label: "Sinyal OLT", icon: Zap },
      { href: "/jaringan/lokasi", label: "Lokasi", icon: MapPin },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: "/pelanggan", label: "Data Pelanggan", icon: Users },
      { href: "/tiket", label: "Tiket Gangguan", icon: AlertTriangle },
      { href: "/operasional/karyawan", label: "Data Karyawan", icon: Users },
      { href: "/pengguna", label: "Pengguna", icon: UserCog },
    ],
  },
];

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  baru: { bg: "#FDEEDB", color: "#B5730B", label: "Baru" },
  ditangani: { bg: "#DDEBFF", color: "#1D5FBF", label: "Ditangani" },
  selesai: { bg: "#DCF5E4", color: "#1D8348", label: "Selesai" },
};

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalPelanggan: 0,
    tiketTerbuka: 0,
    routerOffline: 0,
    totalRouter: 0,
    pendapatanBulanIni: 0,
  });
  const [recentTikets, setRecentTikets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: pelangganCount } = await supabase
        .from("pelanggan")
        .select("*", { count: "exact", head: true });

      const { count: tiketCount } = await supabase
        .from("tiket_gangguan")
        .select("*", { count: "exact", head: true })
        .in("status", ["baru", "ditangani"]);

      const { count: routerOfflineCount } = await supabase
        .from("router")
        .select("*", { count: "exact", head: true })
        .eq("status", "offline");

      const { count: totalRouterCount } = await supabase
        .from("router")
        .select("*", { count: "exact", head: true });

      const { data: voucherBulanIni } = await supabase
        .from("transaksi_voucher")
        .select("nominal_dibayar")
        .eq("status", "lunas")
        .gte("dibayar_at", startOfMonth.toISOString());

      const { data: bulananBulanIni } = await supabase
        .from("pembayaran_bulanan")
        .select("nominal")
        .eq("status", "lunas")
        .gte("divalidasi_at", startOfMonth.toISOString());

      const pendapatan =
        (voucherBulanIni ?? []).reduce((sum, v) => sum + Number(v.nominal_dibayar), 0) +
        (bulananBulanIni ?? []).reduce((sum, b) => sum + Number(b.nominal), 0);

      const { data: tiketData } = await supabase
        .from("tiket_gangguan")
        .select("id, jenis, status, terdeteksi_at, router:router_id(nama), pelanggan:pelanggan_id(nama)")
        .order("terdeteksi_at", { ascending: false })
        .limit(5);

      setStats({
        totalPelanggan: pelangganCount ?? 0,
        tiketTerbuka: tiketCount ?? 0,
        routerOffline: routerOfflineCount ?? 0,
        totalRouter: totalRouterCount ?? 0,
        pendapatanBulanIni: pendapatan,
      });
      setRecentTikets(tiketData ?? []);
      setLoading(false);
    }
    loadStats();
  }, []);

  const statCards = [
    {
      label: "Total Pelanggan",
      value: stats.totalPelanggan,
      icon: Users,
      color: "var(--color-accent)",
      bg: "rgba(30,136,229,0.1)",
    },
    {
      label: "Pendapatan Bulan Ini",
      value: "Rp " + stats.pendapatanBulanIni.toLocaleString("id-ID"),
      icon: Wallet,
      color: "var(--color-signal-good)",
      bg: "rgba(47,174,96,0.1)",
      small: true,
    },
    {
      label: "Tiket Terbuka",
      value: stats.tiketTerbuka,
      icon: AlertTriangle,
      color: stats.tiketTerbuka > 0 ? "var(--color-signal-warn)" : "var(--color-ink-muted)",
      bg: stats.tiketTerbuka > 0 ? "rgba(232,163,61,0.12)" : "var(--color-bg)",
    },
    {
      label: "Status Router",
      value: (stats.totalRouter - stats.routerOffline) + "/" + stats.totalRouter,
      icon: Wifi,
      color: stats.routerOffline > 0 ? "var(--color-signal-bad)" : "var(--color-signal-good)",
      bg: stats.routerOffline > 0 ? "rgba(229,57,53,0.1)" : "rgba(47,174,96,0.1)",
    },
  ];

  return (
    <div>
      <div className="stagger-1 mb-8">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {getGreeting()}, {process.env.NEXT_PUBLIC_BUSINESS_NAME || "IONET+"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-ink-muted)" }}>
          {formatTanggal()}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={"stagger-" + Math.min(i + 2, 5) + " p-5 rounded-xl transition-transform hover:-translate-y-0.5"}
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: card.bg }}
              >
                <Icon size={20} color={card.color} strokeWidth={2} />
              </div>
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--color-ink-muted)" }}>
                {card.label}
              </p>
              <p
                className={card.small ? "text-xl font-semibold" : "text-3xl font-semibold"}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {loading ? "..." : card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="stagger-4">
          <h3 className="text-sm uppercase tracking-wide mb-3" style={{ color: "var(--color-ink-muted)" }}>
            Akses Cepat
          </h3>
          <div className="flex flex-col gap-5">
            {menuGroups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--color-ink-muted)" }}>
                  {group.label}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2.5 p-3 rounded-lg text-sm transition-all hover:shadow-sm"
                        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                      >
                        <ItemIcon size={16} color="var(--color-accent)" strokeWidth={2} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stagger-5">
          <h3 className="text-sm uppercase tracking-wide mb-3" style={{ color: "var(--color-ink-muted)" }}>
            Tiket Terbaru
          </h3>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            {recentTikets.length === 0 ? (
              <p className="p-5 text-sm text-center" style={{ color: "var(--color-ink-muted)" }}>
                Belum ada tiket gangguan
              </p>
            ) : (
              recentTikets.map((t, i) => (
                <div
                  key={t.id}
                  className="p-4 flex items-center justify-between"
                  style={{ borderBottom: i < recentTikets.length - 1 ? "1px solid var(--color-border)" : "none" }}
                >
                  <div>
                    <p className="text-sm font-medium">{t.router?.nama ?? t.pelanggan?.nama ?? "-"}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-muted)" }}>
                      {new Date(t.terdeteksi_at).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ background: statusStyle[t.status]?.bg, color: statusStyle[t.status]?.color }}
                  >
                    {statusStyle[t.status]?.label ?? t.status}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link
            href="/tiket"
            className="block text-center text-sm mt-3 py-2 rounded-lg transition-colors"
            style={{ color: "var(--color-accent)" }}
          >
            Lihat semua tiket →
          </Link>
        </div>
      </div>
    </div>
  );
}