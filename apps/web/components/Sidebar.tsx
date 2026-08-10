// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
      { href: "/backup", label: "Backup Lokal" },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { href: "/pengaturan/notifikasi", label: "Notifikasi WA" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 min-h-screen p-4 flex-shrink-0"
      style={{ background: "var(--color-sidebar)" }}
    >
      <div className="px-2 py-3 mb-4">
        <img src="/logo.png" alt="IONET+" style={{ height: 32 }} />
      </div>

      <nav className="flex flex-col gap-6">
        <Link
          href="/"
          className="px-3 py-2 rounded text-sm"
          style={{
            color: pathname === "/" ? "var(--color-accent)" : "#D1D5DB",
            background: pathname === "/" ? "var(--color-sidebar-hover)" : "transparent",
          }}
        >
          Dashboard
        </Link>

        {menuGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-xs uppercase tracking-wider mb-1" style={{ color: "#6B7280" }}>
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded text-sm"
                  style={{
                    color: active ? "var(--color-accent)" : "#D1D5DB",
                    background: active ? "var(--color-sidebar-hover)" : "transparent",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}