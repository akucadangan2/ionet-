// app/(dashboard)/jaringan/uplink-monitoring/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import SignalIndicator from "@/components/SignalIndicator";

interface UplinkStatus {
  id: string;
  nama: string;
  status: string;
  last_seen_at: string | null;
  lokasi: { nama: string } | null;
}

export default function UplinkMonitoringPage() {
  const [uplinks, setUplinks] = useState<UplinkStatus[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("uplink")
      .select("id, nama, status, last_seen_at, lokasi:lokasi_id(nama)")
      .order("nama");
    setUplinks(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  const totalOnline = uplinks.filter((u) => u.status === "online").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Monitoring Uplink</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        {totalOnline}/{uplinks.length} jalur uplink online — refresh otomatis tiap 30 detik
      </p>

      <div className="grid grid-cols-3 gap-4">
        {uplinks.map((u) => (
          <div
            key={u.id}
            className="p-5 rounded-lg"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--color-ink-muted)" }}>
              {u.lokasi?.nama ?? "-"}
            </p>
            <p className="text-lg font-medium mb-3">{u.nama}</p>
            <div className="flex items-center justify-between">
              <SignalIndicator level={u.status === "online" ? 4 : 0} label={u.status.toUpperCase()} />
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--color-ink-muted)" }}>
              Terakhir online: {u.last_seen_at ? new Date(u.last_seen_at).toLocaleString("id-ID") : "-"}
            </p>
          </div>
        ))}

        {uplinks.length === 0 && (
          <p style={{ color: "var(--color-ink-muted)" }}>
            Belum ada data uplink — tambahkan lewat tabel `uplink` di database.
          </p>
        )}
      </div>
    </div>
  );
}