"use client";

import { useEffect, useState } from "react";

interface Device {
  deviceId: string;
  manufacturer: string;
  productClass: string;
  serialNumber: string;
  ssid: string | null;
  pppoeUsername: string | null;
  externalIp: string | null;
  lastInform: string;
}

export default function GenieAcsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ssidInput, setSsidInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState("");

  async function loadDevices() {
    setLoading(true);
    const res = await fetch("/api/genieacs/devices");
    const json = await res.json();
    setDevices(json.devices || []);
    setLoading(false);
  }

  useEffect(function () {
    loadDevices();
  }, []);

  function openEdit(d: Device) {
    setEditingId(d.deviceId);
    setSsidInput(d.ssid || "");
    setPasswordInput("");
    setResultMsg("");
  }

  async function handleSubmit(deviceId: string) {
    setSubmitting(true);
    setResultMsg("");
    try {
      const res = await fetch("/api/genieacs/set-wifi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, ssid: ssidInput, password: passwordInput || undefined }),
      });
      const json = await res.json();
      setResultMsg(json.message);
    } catch (err) {
      setResultMsg("Gagal: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">Kelola Modem (GenieACS)</h1>
        <button onClick={loadDevices} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)" }}>
          Refresh
        </button>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        {devices.length} modem terhubung
      </p>

      {loading ? (
        <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
                <th className="text-left p-3 text-sm">Username PPPoE</th>
                <th className="text-left p-3 text-sm">Model</th>
                <th className="text-left p-3 text-sm">SSID WiFi</th>
                <th className="text-left p-3 text-sm">IP WAN</th>
                <th className="text-left p-3 text-sm">Terakhir Lapor</th>
                <th className="text-left p-3 text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(function (d) {
                return (
                  <tr key={d.deviceId} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="p-3 text-sm font-medium">{d.pppoeUsername || "-"}</td>
                    <td className="p-3 text-sm">{d.manufacturer} {d.productClass}</td>
                    <td className="p-3 text-sm mono">{d.ssid || "-"}</td>
                    <td className="p-3 text-sm mono">{d.externalIp || "-"}</td>
                    <td className="p-3 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                      {d.lastInform ? new Date(d.lastInform).toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="p-3">
                      <button onClick={function () { openEdit(d); }} className="px-2 py-1 rounded text-sm" style={{ border: "1px solid var(--color-border)" }}>
                        Kelola WiFi
                      </button>
                    </td>
                  </tr>
                );
              })}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-sm" style={{ color: "var(--color-ink-muted)" }}>
                    Belum ada modem yang terhubung
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingId && (
        <div
          onClick={function () { setEditingId(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
        >
          <div
            onClick={function (e) { e.stopPropagation(); }}
            className="p-5 rounded-lg"
            style={{ background: "white", maxWidth: 400, width: "90%" }}
          >
            <h3 className="font-medium mb-3">Ubah Pengaturan WiFi</h3>

            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Nama WiFi (SSID)</label>
            <input
              value={ssidInput}
              onChange={function (e) { setSsidInput(e.target.value); }}
              className="w-full mb-3"
              style={inputStyle}
            />

            <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Password Baru (kosongkan jika tidak diubah)</label>
            <input
              value={passwordInput}
              onChange={function (e) { setPasswordInput(e.target.value); }}
              placeholder="Minimal 8 karakter"
              className="w-full mb-3"
              style={inputStyle}
            />

            {resultMsg && <p className="text-sm mb-3" style={{ color: "var(--color-ink-muted)" }}>{resultMsg}</p>}

            <div className="flex gap-2">
              <button
                onClick={function () { handleSubmit(editingId); }}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm text-white"
                style={{ background: "var(--color-signal-good)", opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? "Mengirim..." : "Terapkan"}
              </button>
              <button onClick={function () { setEditingId(null); }} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--color-border)" }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}