"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Camera, MapPin, CheckCircle } from "lucide-react";

interface Karyawan {
  id: string;
  nama: string;
}

export default function AbsensiPage() {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [selectedKaryawan, setSelectedKaryawan] = useState("");
  const [tipe, setTipe] = useState<"masuk" | "pulang">("masuk");
  const [cameraActive, setCameraActive] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(function () {
    async function load() {
      const result = await supabase.from("karyawan").select("id, nama").eq("status", "aktif").order("nama");
      setKaryawanList(result.data || []);
    }
    load();
  }, []);

  useEffect(function () {
    if (!navigator.geolocation) {
      setLocationError("Browser tidak mendukung GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      function () {
        setLocationError("Gagal mendapatkan lokasi, pastikan izin GPS diaktifkan");
      }
    );
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setErrorMsg("Gagal mengakses kamera, pastikan izin kamera diaktifkan");
    }
  }

  function takePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const maxWidth = 480;
      const scale = Math.min(1, maxWidth / videoRef.current.videoWidth);
      canvas.width = videoRef.current.videoWidth * scale;
      canvas.height = videoRef.current.videoHeight * scale;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setPhotoData(canvas.toDataURL("image/jpeg", 0.5));
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(function (t) { t.stop(); });
    }
    setCameraActive(false);
  }

  async function handleSubmit() {
    setErrorMsg("");
    if (!selectedKaryawan || !photoData || !location) {
      setErrorMsg("Lengkapi nama, foto, dan pastikan lokasi terdeteksi");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          karyawanId: selectedKaryawan,
          tipe: tipe,
          latitude: location.lat,
          longitude: location.lng,
          fotoBase64: photoData,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setSuccess(true);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--color-bg)" }}>
        <div className="text-center">
          <CheckCircle size={48} color="var(--color-signal-good)" style={{ margin: "0 auto 16px" }} />
          <h1 className="text-xl font-semibold mb-2">Absen Berhasil</h1>
          <p style={{ color: "var(--color-ink-muted)" }}>Absen {tipe} tercatat pukul {new Date().toLocaleTimeString("id-ID")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", padding: 24 }}>
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        <img src="/logo.png" alt="IONET Plus" style={{ height: 32, margin: "0 auto 24px", display: "block" }} />
        <h1 className="text-xl font-semibold text-center mb-6">Absensi Karyawan</h1>

        <div className="rounded-lg p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-ink-muted)" }}>Nama Karyawan</label>
          <select
            value={selectedKaryawan}
            onChange={function (e) { setSelectedKaryawan(e.target.value); }}
            className="w-full mb-4"
            style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "10px 14px" }}
          >
            <option value="">- Pilih Nama -</option>
            {karyawanList.map(function (k) {
              return <option key={k.id} value={k.id}>{k.nama}</option>;
            })}
          </select>

          <div className="flex gap-2 mb-4">
            <button
              onClick={function () { setTipe("masuk"); }}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ background: tipe === "masuk" ? "var(--color-accent)" : "transparent", color: tipe === "masuk" ? "white" : "var(--color-ink)", border: "1px solid var(--color-border)" }}
            >
              Absen Masuk
            </button>
            <button
              onClick={function () { setTipe("pulang"); }}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ background: tipe === "pulang" ? "var(--color-accent)" : "transparent", color: tipe === "pulang" ? "white" : "var(--color-ink)", border: "1px solid var(--color-border)" }}
            >
              Absen Pulang
            </button>
          </div>

          <div className="mb-4 p-3 rounded-lg text-xs flex items-center gap-2" style={{ background: "var(--color-bg)" }}>
            <MapPin size={14} color={location ? "var(--color-signal-good)" : "var(--color-signal-bad)"} />
            {location ? "Lokasi terdeteksi: " + location.lat.toFixed(5) + ", " + location.lng.toFixed(5) : locationError || "Mendeteksi lokasi..."}
          </div>

          {!photoData && !cameraActive && (
            <button
              onClick={startCamera}
              className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              style={{ border: "1px solid var(--color-accent)", color: "var(--color-accent)" }}
            >
              <Camera size={16} /> Ambil Foto Selfie
            </button>
          )}

          {cameraActive && (
            <div>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" style={{ transform: "scaleX(-1)", display: "block" }} />
                <svg
                  viewBox="0 0 300 400"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
                >
                  <defs>
                    <mask id="face-guide-mask">
                      <rect x="0" y="0" width="300" height="400" fill="white" />
                      <ellipse cx="150" cy="190" rx="95" ry="130" fill="black" />
                    </mask>
                  </defs>
                  <rect x="0" y="0" width="300" height="400" fill="rgba(0,0,0,0.45)" mask="url(#face-guide-mask)" />
                  <ellipse cx="150" cy="190" rx="95" ry="130" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="8 6" />
                </svg>
                <p
                  style={{
                    position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center",
                    color: "white", fontSize: 12, fontWeight: 500, textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                  }}
                >
                  Posisikan wajah di dalam bingkai
                </p>
              </div>
              <button onClick={takePhoto} className="w-full py-3 rounded-lg text-sm font-medium text-white" style={{ background: "var(--color-accent)" }}>
                Ambil Foto
              </button>
            </div>
          )}

          {photoData && (
            <div>
              <img src={photoData} alt="Selfie" className="w-full rounded-lg mb-3" style={{ transform: "scaleX(-1)" }} />
              <button onClick={function () { setPhotoData(null); startCamera(); }} className="text-xs mb-3" style={{ color: "var(--color-accent)" }}>
                Ambil ulang foto
              </button>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {errorMsg && <p className="text-sm mb-3" style={{ color: "var(--color-signal-bad)" }}>{errorMsg}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || !photoData || !location || !selectedKaryawan}
            className="w-full py-3 rounded-lg text-sm font-medium text-white mt-2"
            style={{ background: "var(--color-signal-good)", opacity: submitting || !photoData || !location || !selectedKaryawan ? 0.5 : 1 }}
          >
            {submitting ? "Mengirim..." : "Submit Absen"}
          </button>
        </div>
      </div>
    </div>
  );
}