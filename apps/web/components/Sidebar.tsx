// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  Bot,
  Bell,
  Database,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const menuGroups = [
  {
    label: "Billing",
    items: [
      { href: "/billing/voucher", label: "Voucher", icon: Ticket },
      { href: "/billing/voucher-massal", label: "Generate Voucher Massal", icon: Ticket },
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
      { href: "/jaringan/rekap-uplink", label: "Rekap Uplink", icon: Gauge },
      { href: "/jaringan/sinyal-olt", label: "Sinyal OLT", icon: Zap },
      { href: "/jaringan/genieacs", label: "Kelola Modem", icon: Wifi },
      { href: "/jaringan/genieacs-coverage", label: "Cakupan GenieACS", icon: Radio },
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
      { href: "/operasional/absensi", label: "Rekap Absensi", icon: AlertTriangle },
      { href: "/operasional/kasbon", label: "Kasbon", icon: Wallet },
      { href: "/operasional/payroll", label: "Payroll", icon: Wallet },
      { href: "/operasional/komisi", label: "Komisi", icon: Wallet },
      { href: "/backup", label: "Backup Lokal", icon: Database },
      { href: "/operasional/asisten-hr", label: "Bot HR", icon: Bot, highlight: true },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { href: "/pengaturan/notifikasi", label: "Notifikasi WA", icon: Bell },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setCollapsed(function (prev) {
      return { ...prev, [label]: !prev[label] };
    });
  }

  return (
    <aside
      className="w-64 min-h-screen p-4 flex-shrink-0 overflow-y-auto"
      style={{ background: "var(--color-sidebar)" }}
    >
      <div className="px-2 py-3 mb-4">
        <img src="/logo.png" alt="IONET+" style={{ height: 32 }} />
      </div>

      <nav className="flex flex-col gap-1">
        <Link
          href="/"
          className="px-3 py-2 rounded text-sm mb-4"
          style={{
            color: pathname === "/" ? "var(--color-accent)" : "#D1D5DB",
            background: pathname === "/" ? "var(--color-sidebar-hover)" : "transparent",
          }}
        >
          Dashboard
        </Link>

        {menuGroups.map((group) => {
          const isCollapsed = collapsed[group.label];
          return (
            <div key={group.label} className="mb-3">
              <button
                onClick={function () { toggleGroup(group.label); }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs uppercase tracking-wider transition-colors"
                style={{ color: "#6B7280", background: "transparent", border: "none", cursor: "pointer" }}
              >
                <span>{group.label}</span>
                {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>

              {!isCollapsed && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {group.items.map((item: any) => {
                    const active = pathname.startsWith(item.href);
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors"
                        style={{
                          color: active ? "var(--color-accent)" : "#D1D5DB",
                          background: active
                            ? "var(--color-sidebar-hover)"
                            : item.highlight
                            ? "rgba(30,136,229,0.06)"
                            : "transparent",
                        }}
                      >
                        <ItemIcon size={15} style={{ flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.3 }}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}