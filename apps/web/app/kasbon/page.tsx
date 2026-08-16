"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { CheckCircle } from "lucide-react";

interface Karyawan {
  id: string;
  nama: string;
}

export default function KasbonPage() {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [selectedKaryawan, setSelectedKaryawan] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [alasan, setAlasan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(function () {
    async function load() {
      const result = await supabase.from("karyawan").select("id, nama").eq("status", "aktif").order("nama");
      setKaryawanList(result.data || []);
    }
    load();
  }, []);

  async function handleSubmit() {
    setErrorMsg("");
    if (!selectedKaryawan || !jumlah) {
      setErrorMsg("Pilih nama dan isi jumlah kasbon dulu");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/kasbon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ karyawanId: selectedKaryawan, jumlah: parseFloat(jumlah), alasan }),
      });
      if (!res.ok) throw new Error("Gagal mengirim pengajuan");
      setSuccess(true);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: 8, padding: "10px 14px" };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--color-bg)" }}>
        <div className="text-center">
          <CheckCircle size={48} color="var(--color-signal-good)" style={{ margin: "0 auto 16px" }} />
          <h1 className="text-xl font-semibold mb-2">Pengajuan Terkirim</h1>
          <p style={{ color: "var(--color-ink-muted)" }}>Menunggu persetujuan admin</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", padding: 24 }}>
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        <img src="/logo.png" alt="IONET Plus" style={{ height: 32, margin: "0 auto 24px", display: "block" }} />
        <h1 className="text-xl font-semibold text-center mb-6">Pengajuan Kasbon</h1>

        <div className="rounded-lg p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-ink-muted)" }}>Nama</label>
          <select
            value={selectedKaryawan}
            onChange={function (e) { setSelectedKaryawan(e.target.value); }}
            className="w-full mb-4"
            style={inputStyle}
          >
            <option value="">- Pilih Nama -</option>
            {karyawanList.map(function (k) {
              return <option key={k.id} value={k.id}>{k.nama}</option>;
            })}
          </select>

          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-ink-muted)" }}>Jumlah Kasbon</label>
          <input
            type="number"
            placeholder="500000"
            value={jumlah}
            onChange={function (e) { setJumlah(e.target.value); }}
            className="w-full mb-4"
            style={inputStyle}
          />

          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-ink-muted)" }}>Alasan (opsional)</label>
          <textarea
            placeholder="Keperluan mendesak..."
            value={alasan}
            onChange={function (e) { setAlasan(e.target.value); }}
            className="w-full mb-4"
            style={{ ...inputStyle, minHeight: 70 }}
          />

          {errorMsg && <p className="text-sm mb-4" style={{ color: "var(--color-signal-bad)" }}>{errorMsg}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--color-accent)", opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? "Mengirim..." : "Ajukan Kasbon"}
          </button>
        </div>
      </div>
    </div>
  );
}