// components/Topbar.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const [staffName, setStaffName] = useState("");
  const [role, setRole] = useState("");
  const router = useRouter();

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
      className="flex items-center justify-between px-6 py-3"
      style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
    >
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">{staffName}</p>
          <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
            {roleLabel[role] ?? role}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 rounded"
          style={{ border: "1px solid var(--color-border)" }}
        >
          Keluar
        </button>
      </div>
    </header>
  );
}