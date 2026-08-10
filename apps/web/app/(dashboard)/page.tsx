// app/(dashboard)/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import SignalIndicator from "@/components/SignalIndicator";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalPelanggan: 0,
    tiketTerbuka: 0,
    routerOffline: 0,
    totalRouter: 0,
  });

  useEffect(() => {
    async function loadStats() {
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

      setStats({
        totalPelanggan: pelangganCount ?? 0,
        tiketTerbuka: tiketCount ?? 0,
        routerOffline: routerOfflineCount ?? 0,
        totalRouter: totalRouterCount ?? 0,
      });
    }
    loadStats();
  }, []);

  const menuGroups = [
    {
      label: "Billing",
      items: [
        { href: "/billing/voucher", label: "Voucher" },
        { href: "/billing/langganan-bulanan", label: "Langganan Bulanan" },
        { href: "/billing/paket", label: "Paket Harga" },
        { href: "/billing/laporan-keuangan", label: "Laporan Keuangan" },
      ],
    },
    {
      label: "Jaringan",
      items: [
        { href: "/jaringan/peta", label: "Peta Jaringan" },
        { href: "/jaringan/bandwidth", label: "Bandwidth" },
        { href: "/jaringan/uplink-monitoring", label: "Monitoring Uplink" },
        { href: "/jaringan/radius", label: "RADIUS" },
        { href: "/jaringan/lokasi", label: "Lokasi" },
      ],
    },
    {
      label: "Operasional",
      items: [
        { href: "/pelanggan", label: "Data Pelanggan" },
        { href: "/tiket", label: "Tiket Gangguan" },
        { href: "/pengguna", label: "Pengguna" },
      ],
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Ringkasan operasional hari ini
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div
          className="p-5 rounded-lg"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--color-ink-muted)" }}>
            Total Pelanggan
          </p>
          <p className="text-3xl font-display" style={{ fontFamily: "var(--font-display)" }}>
            {stats.totalPelanggan}
          </p>
        </div>

        <div
          className="p-5 rounded-lg"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--color-ink-muted)" }}>
            Tiket Terbuka
          </p>
          <p
            className="text-3xl font-display"
            style={{
              fontFamily: "var(--font-display)",
              color: stats.tiketTerbuka > 0 ? "var(--color-signal-warn)" : "var(--color-ink)",
            }}
          >
            {stats.tiketTerbuka}
          </p>
        </div>

        <div
          className="p-5 rounded-lg"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--color-ink-muted)" }}>
            Status Router
          </p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-display" style={{ fontFamily: "var(--font-display)" }}>
              {stats.totalRouter - stats.routerOffline}/{stats.totalRouter}
            </p>
            <SignalIndicator level={stats.routerOffline > 0 ? 1 : 4} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm uppercase tracking-wide mb-3" style={{ color: "var(--color-ink-muted)" }}>
              {group.label}
            </h3>
            <div className="flex flex-col gap-2">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="p-3 rounded-lg text-sm hover:shadow-sm transition"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}