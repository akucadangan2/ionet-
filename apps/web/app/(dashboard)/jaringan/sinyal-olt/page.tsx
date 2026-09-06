"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const NetworkMap = dynamic(() => import("@/components/NetworkMap"), { ssr: false });

interface Signal {
  onuIndex: string;
  name: string | null;
  rxPowerDbm: number | null;
}

interface MapPoint {
  id: string;
  nama: string;
  latitude: number;
  longitude: number;
  status: string;
  rxPower: number | null;
  signalStatus?: "lemah" | "normal";
}

function signalColor(dbm: number | null) {
  if (dbm === null) return "var(--color-ink-muted)";
  if (dbm >= -8) return "var(--color-signal-warn)";
  if (dbm >= -25) return "var(--color-signal-good)";
  return "var(--color-signal-bad)";
}

function signalLabel(dbm: number | null) {
  if (dbm === null) return "Tidak Ada Data";
  if (dbm >= -8) return "Terlalu Kuat";
  if (dbm >= -25) return "Normal";
  return "Lemah";
}

export default function SinyalOltPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/olt/signal");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setSignals(json.signals || []);
      setMapPoints(json.mapPoints || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const sorted = [...signals].sort((a, b) => {
    if (a.rxPowerDbm === null && b.rxPowerDbm === null) return 0;
    if (a.rxPowerDbm === null) return 1;
    if (b.rxPowerDbm === null) return -1;
    return a.rxPowerDbm - b.rxPowerDbm;
  });
  const lemahCount = signals.filter((s) => s.rxPowerDbm !== null && s.rxPowerDbm < -25).length;

  const mapCenter: [number, number] =
    mapPoints.length > 0 ? [mapPoints[0].latitude, mapPoints[0].longitude] : [-5.45, 105.27];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Sinyal Laser OLT
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-ink-muted)" }}>
            {signals.length} ONU terpantau, {lemahCount} sinyal lemah
            {mapPoints.length > 0 && ` \u00b7 ${mapPoints.length} titik terpetakan`}
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--color-border)" }}
        >
          Refresh
        </button>
      </div>

      {loading && (
        <p style={{ color: "var(--color-ink-muted)" }}>Memuat data sinyal...</p>
      )}

      {error && (
        <p style={{ color: "var(--color-signal-bad)" }}>Gagal memuat: {error}</p>
      )}

      {!loading && !error && (
        <>
          <div
            className="rounded-xl overflow-hidden mb-6"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--color-bg)" }}>
                  <th className="text-left p-3">Nama / ONU Index</th>
                  <th className="text-left p-3">Rx Power</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr key={s.onuIndex} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="p-3">{s.name || `ONU ${s.onuIndex}`}</td>
                    <td className="p-3">{s.rxPowerDbm !== null ? `${s.rxPowerDbm.toFixed(1)} dBm` : "-"}</td>
                    <td className="p-3">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ background: signalColor(s.rxPowerDbm) + "22", color: signalColor(s.rxPowerDbm) }}
                      >
                        {signalLabel(s.rxPowerDbm)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mapPoints.length > 0 ? (
            <div>
              <h2 className="text-sm font-medium mb-2" style={{ color: "var(--color-ink-muted)" }}>
                Peta Titik Pelanggan Terpetakan
              </h2>
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                <NetworkMap
                  routers={[]}
                  pelanggan={mapPoints.map(function (m) {
                    return {
                      id: m.id,
                      nama: m.nama,
                      latitude: m.latitude,
                      longitude: m.longitude,
                      status: m.status,
                      rxPower: m.rxPower === null ? undefined : m.rxPower,
                      signalStatus: m.signalStatus,
                    };
                  })}
                  center={mapCenter}
                  height="450px"
                  showLayerPanel={false}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
              Belum ada ONU yang namanya cocok dengan username pelanggan yang punya titik GPS - peta belum bisa ditampilkan.
            </p>
          )}
        </>
      )}
    </div>
  );
}