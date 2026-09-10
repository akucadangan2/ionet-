"use client";

import { useEffect, useState } from "react";

interface JamKerja {
  id: string;
  shift: string;
  jam_masuk: string;
  jam_pulang: string;
}

const shiftLabel: Record<string, string> = { pagi: "Pagi", siang: "Siang" };

export default function JamKerjaPage() {
  const [list, setList] = useState<JamKerja[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingShift, setSavingShift] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, { jam_masuk: string; jam_pulang: string }>>({});

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/jam-kerja");
    const json = await res.json();
    const data: JamKerja[] = json.data || [];
    setList(data);
    const formInit: Record<string, { jam_masuk: string; jam_pulang: string }> = {};
    data.forEach(function (j) {
      formInit[j.shift] = { jam_masuk: j.jam_masuk.slice(0, 5), jam_pulang: j.jam_pulang.slice(0, 5) };
    });
    setForm(formInit);
    setLoading(false);
  }

  useEffect(function () {
    loadData();
  }, []);

  async function handleSimpan(shift: string) {
    setSavingShift(shift);
    try {
      await fetch("/api/jam-kerja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift,
          jamMasuk: form[shift].jam_masuk,
          jamPulang: form[shift].jam_pulang,
        }),
      });
      loadData();
    } finally {
      setSavingShift(null);
    }
  }

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px" };

  if (loading) return <p style={{ color: "var(--color-ink-muted)" }}>Memuat...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Pengaturan Jam Kerja</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
        Khusus Super Admin - atur jam masuk dan pulang untuk tiap shift. Ini nantinya dipakai buat deteksi keterlambatan otomatis.
      </p>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {list.map(function (j) {
          const f = form[j.shift] || { jam_masuk: "", jam_pulang: "" };
          return (
            <div key={j.id} className="p-5 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <h3 className="font-medium mb-3">Shift {shiftLabel[j.shift] || j.shift}</h3>
              <div className="flex gap-2 mb-3">
                <div style={{ flex: 1 }}>
                  <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Jam Masuk</label>
                  <input
                    type="time"
                    value={f.jam_masuk}
                    onChange={function (e) { setForm({ ...form, [j.shift]: { ...f, jam_masuk: e.target.value } }); }}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="text-xs block mb-1" style={{ color: "var(--color-ink-muted)" }}>Jam Pulang</label>
                  <input
                    type="time"
                    value={f.jam_pulang}
                    onChange={function (e) { setForm({ ...form, [j.shift]: { ...f, jam_pulang: e.target.value } }); }}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
              </div>
              <button
                onClick={function () { handleSimpan(j.shift); }}
                disabled={savingShift === j.shift}
                className="px-4 py-2 rounded-lg text-sm text-white"
                style={{ background: "var(--color-signal-good)", opacity: savingShift === j.shift ? 0.6 : 1 }}
              >
                {savingShift === j.shift ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          );
        })}
        {list.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>Belum ada data shift, pastikan sudah jalanin SQL setup awal</p>
        )}
      </div>
    </div>
  );
}