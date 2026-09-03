// components/TopNav.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
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

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [staffName, setStaffName] = useState("");
  const [role, setRole] = useState("");
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadStaff() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: staff } = await supabase
        .from("staff")
        .select("nama, role")
        .eq("auth_user_id", user.id)
        .single();
      if (staff) {
        setStaffName(staff.nama);
        setRole(staff.role);
      }
    }
    loadStaff();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const roleLabel: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    teknisi: "Teknisi",
  };

  return (
    <header
      ref={navRef}
      style={{ background: "var(--color-sidebar)", borderBottom: "1px solid #1E2630" }}
    >
      <div className="flex items-center justify-between px-6" style={{ height: 64 }}>
        <div className="flex items-center gap-8">
          <img src="/logo.png" alt="IONET+" style={{ height: 36, objectFit: "contain" }} />

          <nav className="flex items-center gap-1">
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

            {menuGroups.map((group) => {
              const groupActive = group.items.some((item) => pathname.startsWith(item.href));
              return (
                <div key={group.label} className="relative">
                  <button
                    onClick={() => setOpenGroup(openGroup === group.label ? null : group.label)}
                    className="px-3 py-2 rounded text-sm flex items-center gap-1"
                    style={{
                      color: groupActive || openGroup === group.label ? "var(--color-accent)" : "#D1D5DB",
                      background: openGroup === group.label ? "var(--color-sidebar-hover)" : "transparent",
                    }}
                  >
                    {group.label}
                    <span style={{ fontSize: 10 }}>▾</span>
                  </button>

                  {openGroup === group.label && (
                    <div
                      className="absolute top-full left-0 mt-1 rounded-lg overflow-y-auto z-50"
                      style={{
                        background: "var(--color-sidebar)",
                        border: "1px solid #1E2630",
                        minWidth: 220,
                        maxHeight: 340,
                      }}
                    >
                      {group.items.map((item: any) => {
                        const active = pathname.startsWith(item.href);
                        const ItemIcon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpenGroup(null)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm"
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
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{staffName}</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>{roleLabel[role] ?? role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded"
            style={{ border: "1px solid #374151", color: "#D1D5DB" }}
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}