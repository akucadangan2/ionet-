"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Camera,
  MapPin,
  CheckCircle,
  ExternalLink,
  Copy,
  Map,
  X,
} from "lucide-react";

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

  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [locationError, setLocationError] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [copied, setCopied] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [lockedNama, setLockedNama] = useState<string | null>(null);
  const [belumLink, setBelumLink] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* =========================================================
     LOAD KARYAWAN
  ========================================================= */
  useEffect(function () {
    async function load() {
      const result = await supabase
        .from("karyawan")
        .select("id, nama")
        .eq("status", "aktif")
        .order("nama");

      const list = result.data || [];
      setKaryawanList(list);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const staffResult = await supabase
          .from("staff")
          .select("role, karyawan_id, karyawan:karyawan_id(id, nama)")
          .eq("auth_user_id", user.id)
          .single();

        if (staffResult.data && staffResult.data.role !== "super_admin") {
          const karyawanRel = staffResult.data.karyawan as unknown as {
            id: string;
            nama: string;
          } | null;

          if (karyawanRel) {
            setSelectedKaryawan(karyawanRel.id);
            setLockedNama(karyawanRel.nama);
          } else {
            setBelumLink(true);
          }
        }
      }

      setCheckingUser(false);
    }

    load();
  }, []);

  /* =========================================================
     GPS
  ========================================================= */
  useEffect(function () {
    if (!navigator.geolocation) {
      setLocationError("Browser tidak mendukung GPS");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      function () {
        setLocationError(
          "Gagal mendapatkan lokasi, pastikan izin GPS diaktifkan"
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  /* =========================================================
     CAMERA
  ========================================================= */
  useEffect(function () {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
      });

      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setErrorMsg(
        "Gagal mengakses kamera, pastikan izin kamera diaktifkan"
      );
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

      const scale = Math.min(
        1,
        maxWidth / videoRef.current.videoWidth
      );

      canvas.width = videoRef.current.videoWidth * scale;
      canvas.height = videoRef.current.videoHeight * scale;

      ctx.drawImage(
        videoRef.current,
        0,
        0,
        canvas.width,
        canvas.height
      );

      setPhotoData(
        canvas.toDataURL("image/jpeg", 0.5)
      );
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach(function (t) {
          t.stop();
        });
    }

    setCameraActive(false);
  }

  /* =========================================================
     LOCATION HELPERS
  ========================================================= */

  function openGoogleMaps() {
    if (!location) return;

    window.open(
      `https://www.google.com/maps?q=${location.lat},${location.lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copyCoordinate() {
    if (!location) return;

    const coordinate = `${location.lat}, ${location.lng}`;

    try {
      await navigator.clipboard.writeText(coordinate);

      setCopied(true);

      setTimeout(function () {
        setCopied(false);
      }, 1500);
    } catch {
      setErrorMsg("Gagal menyalin koordinat");
    }
  }

  function getMapEmbedUrl() {
    if (!location) return "";

    const delta = 0.003;

    const left = location.lng - delta;
    const right = location.lng + delta;
    const top = location.lat + delta;
    const bottom = location.lat - delta;

    return (
      "https://www.openstreetmap.org/export/embed.html" +
      `?bbox=${left}%2C${bottom}%2C${right}%2C${top}` +
      `&layer=mapnik&marker=${location.lat}%2C${location.lng}`
    );
  }

  /* =========================================================
     SUBMIT
  ========================================================= */

  async function handleSubmit() {
    setErrorMsg("");

    if (!selectedKaryawan || !photoData || !location) {
      setErrorMsg(
        "Lengkapi nama, foto, dan pastikan lokasi terdeteksi"
      );

      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/absensi", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          karyawanId: selectedKaryawan,
          tipe: tipe,
          latitude: location.lat,
          longitude: location.lng,
          fotoBase64: photoData,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message);
      }

      setSuccess(true);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================================================
     SUCCESS
  ========================================================= */

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "var(--color-bg)",
        }}
      >
        <div className="text-center success-box">
          <CheckCircle
            size={54}
            color="var(--color-signal-good)"
            style={{
              margin: "0 auto 16px",
            }}
          />

          <h1 className="text-xl font-semibold mb-2">
            Absen Berhasil
          </h1>

          <p
            style={{
              color: "var(--color-ink-muted)",
            }}
          >
            Absen {tipe} tercatat pukul{" "}
            {new Date().toLocaleTimeString("id-ID")}
          </p>

          {location && (
            <button
              onClick={openGoogleMaps}
              className="mt-4 inline-flex items-center gap-2 text-sm"
              style={{
                color: "var(--color-accent)",
              }}
            >
              <MapPin size={15} />
              Lihat lokasi absensi
            </button>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        padding: "24px 24px 150px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          margin: "0 auto",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* LOGO */}

        <img
          src="/logo.png"
          alt="IONET Plus"
          style={{
            height: 34,
            margin: "0 auto 22px",
            display: "block",
          }}
        />

        <h1 className="text-xl font-semibold text-center mb-1">
          Absensi Karyawan
        </h1>

        <p
          className="text-xs text-center mb-6"
          style={{
            color: "var(--color-ink-muted)",
          }}
        >
          Pastikan foto dan lokasi sesuai sebelum melakukan absensi
        </p>

        {/* =====================================================
            FORM
        ====================================================== */}

        <div
          className="rounded-xl p-5 attendance-card"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* NAME */}

          <label
            className="text-xs font-medium mb-2 block"
            style={{
              color: "var(--color-ink-muted)",
            }}
          >
            Nama Karyawan
          </label>

          {checkingUser ? (
            <p
              className="text-sm mb-4"
              style={{
                color: "var(--color-ink-muted)",
              }}
            >
              Memuat...
            </p>
          ) : lockedNama ? (
            <div
              className="w-full mb-4"
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: 9,
                padding: "11px 14px",
                background: "var(--color-bg)",
                color: "var(--color-ink)",
              }}
            >
              {lockedNama}
            </div>
          ) : (
            <select
              value={selectedKaryawan}
              onChange={function (e) {
                setSelectedKaryawan(e.target.value);
              }}
              className="w-full mb-4"
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: 9,
                padding: "11px 14px",
                background: "var(--color-surface)",
              }}
            >
              <option value="">
                - Pilih Nama -
              </option>

              {karyawanList.map(function (k) {
                return (
                  <option
                    key={k.id}
                    value={k.id}
                  >
                    {k.nama}
                  </option>
                );
              })}
            </select>
          )}

          {!checkingUser && belumLink && (
            <p
              className="text-sm mb-4"
              style={{
                color: "var(--color-signal-bad)",
              }}
            >
              Akun kamu belum dihubungkan ke data Karyawan.
              Hubungi Super Admin untuk di-link terlebih dahulu
              lewat halaman Manajemen Pengguna.
            </p>
          )}

          {/* ABSEN TYPE */}

          <div className="flex gap-2 mb-4">
            <button
              onClick={function () {
                setTipe("masuk");
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background:
                  tipe === "masuk"
                    ? "var(--color-accent)"
                    : "transparent",

                color:
                  tipe === "masuk"
                    ? "white"
                    : "var(--color-ink)",

                border:
                  "1px solid var(--color-border)",
              }}
            >
              Absen Masuk
            </button>

            <button
              onClick={function () {
                setTipe("pulang");
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background:
                  tipe === "pulang"
                    ? "var(--color-accent)"
                    : "transparent",

                color:
                  tipe === "pulang"
                    ? "white"
                    : "var(--color-ink)",

                border:
                  "1px solid var(--color-border)",
              }}
            >
              Absen Pulang
            </button>
          </div>

          {/* =====================================================
              LOCATION
          ====================================================== */}

          <div
            className="mb-4 rounded-xl overflow-hidden"
            style={{
              border: "1px solid var(--color-border)",
              background: "var(--color-bg)",
            }}
          >
            <button
              type="button"
              onClick={function () {
                if (location) {
                  setShowMap(!showMap);
                }
              }}
              className="w-full p-3 text-left"
              style={{
                cursor: location
                  ? "pointer"
                  : "default",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: 34,
                    height: 34,

                    background: location
                      ? "rgba(34,197,94,0.10)"
                      : "rgba(239,68,68,0.08)",
                  }}
                >
                  <MapPin
                    size={17}
                    color={
                      location
                        ? "var(--color-signal-good)"
                        : "var(--color-signal-bad)"
                    }
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-medium mb-1"
                    style={{
                      color: "var(--color-ink)",
                    }}
                  >
                    Lokasi Absensi
                  </div>

                  <div
                    className="text-xs"
                    style={{
                      color: "var(--color-ink-muted)",
                    }}
                  >
                    {location
                      ? `${location.lat.toFixed(
                          6
                        )}, ${location.lng.toFixed(6)}`
                      : locationError ||
                        "Mendeteksi lokasi..."}
                  </div>
                </div>

                {location && (
                  <Map
                    size={16}
                    style={{
                      color: "var(--color-accent)",
                    }}
                  />
                )}
              </div>
            </button>

            {/* MAP PREVIEW */}

            {location && showMap && (
              <div
                className="map-preview"
                style={{
                  borderTop:
                    "1px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    height: 190,
                    background: "#e5e7eb",
                  }}
                >
                  <iframe
                    src={getMapEmbedUrl()}
                    title="Preview Lokasi Absensi"
                    width="100%"
                    height="100%"
                    style={{
                      border: 0,
                      display: "block",
                    }}
                    loading="lazy"
                  />

                  <button
                    onClick={function () {
                      setShowMap(false);
                    }}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      border: "none",
                      background: "rgba(255,255,255,0.92)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow:
                        "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="flex gap-2 p-3">
                  <button
                    onClick={openGoogleMaps}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium"
                    style={{
                      background:
                        "var(--color-accent)",
                      color: "white",
                    }}
                  >
                    <ExternalLink size={14} />

                    Google Maps
                  </button>

                  <button
                    onClick={copyCoordinate}
                    className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium"
                    style={{
                      border:
                        "1px solid var(--color-border)",

                      background:
                        "var(--color-surface)",

                      color: "var(--color-ink)",
                    }}
                  >
                    <Copy size={14} />

                    {copied ? "Tersalin" : "Salin"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =====================================================
              CAMERA
          ====================================================== */}

          {!photoData && !cameraActive && (
            <button
              onClick={startCamera}
              className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              style={{
                border:
                  "1px solid var(--color-accent)",
                color: "var(--color-accent)",
              }}
            >
              <Camera size={16} />

              Ambil Foto Selfie
            </button>
          )}

          {cameraActive && (
            <div>
              <div
                style={{
                  position: "relative",
                  marginBottom: 12,
                  overflow: "hidden",
                  borderRadius: 12,
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full"
                  style={{
                    transform: "scaleX(-1)",
                    display: "block",
                  }}
                />

                <svg
                  viewBox="0 0 300 400"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                >
                  <defs>
                    <mask id="face-guide-mask">
                      <rect
                        x="0"
                        y="0"
                        width="300"
                        height="400"
                        fill="white"
                      />

                      <ellipse
                        cx="150"
                        cy="190"
                        rx="95"
                        ry="130"
                        fill="black"
                      />
                    </mask>
                  </defs>

                  <rect
                    x="0"
                    y="0"
                    width="300"
                    height="400"
                    fill="rgba(0,0,0,0.45)"
                    mask="url(#face-guide-mask)"
                  />

                  <ellipse
                    cx="150"
                    cy="190"
                    rx="95"
                    ry="130"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeDasharray="8 6"
                  />
                </svg>

                <p
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 500,
                    textShadow:
                      "0 1px 4px rgba(0,0,0,0.6)",
                  }}
                >
                  Posisikan wajah di dalam bingkai
                </p>
              </div>

              <button
                onClick={takePhoto}
                className="w-full py-3 rounded-lg text-sm font-medium text-white"
                style={{
                  background:
                    "var(--color-accent)",
                }}
              >
                Ambil Foto
              </button>
            </div>
          )}

          {photoData && (
            <div>
              <img
                src={photoData}
                alt="Selfie"
                className="w-full rounded-lg mb-3"
                style={{
                  transform: "scaleX(-1)",
                }}
              />

              <button
                onClick={function () {
                  setPhotoData(null);
                  startCamera();
                }}
                className="text-xs mb-3"
                style={{
                  color: "var(--color-accent)",
                }}
              >
                Ambil ulang foto
              </button>
            </div>
          )}

          <canvas
            ref={canvasRef}
            style={{
              display: "none",
            }}
          />

          {errorMsg && (
            <p
              className="text-sm mb-3"
              style={{
                color: "var(--color-signal-bad)",
              }}
            >
              {errorMsg}
            </p>
          )}

          {/* SUBMIT */}

          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              !photoData ||
              !location ||
              !selectedKaryawan
            }
            className="w-full py-3 rounded-lg text-sm font-medium text-white mt-3 submit-button"
            style={{
              background:
                "var(--color-signal-good)",

              opacity:
                submitting ||
                !photoData ||
                !location ||
                !selectedKaryawan
                  ? 0.5
                  : 1,
            }}
          >
            {submitting
              ? "Mengirim..."
              : "Submit Absen"}
          </button>
        </div>
      </div>

      {/* =====================================================
          MARIO-STYLE WIFI TECHNICIAN
      ====================================================== */}

      <div className="game-world">
        {/* Road */}

        <div className="game-ground">
          <div className="road-line road-line-1" />
          <div className="road-line road-line-2" />
          <div className="road-line road-line-3" />
          <div className="road-line road-line-4" />
        </div>

        {/* WiFi tower */}

        <div className="wifi-tower">
          <div className="tower-light" />

          <div className="tower-head" />

          <div className="tower-body">
            <div />
            <div />
            <div />
          </div>

          <div className="tower-wave wave-1" />
          <div className="tower-wave wave-2" />
          <div className="tower-wave wave-3" />
        </div>

        {/* Router */}

        <div className="mini-router">
          <div className="router-antenna left" />
          <div className="router-antenna right" />

          <span />
          <span />
          <span />

          <small>WiFi</small>
        </div>

        {/* Coins */}

        <div className="wifi-coin coin-1">
          +
        </div>

        <div className="wifi-coin coin-2">
          +
        </div>

        <div className="wifi-coin coin-3">
          +
        </div>

        {/* Technician */}

        <div className="wifi-technician">
          <div className="tech-shadow" />

          <div className="backpack" />

          <div className="technician-cap">
            +
          </div>

          <div className="technician-head">
            <div className="hair" />

            <div className="eye eye-left" />
            <div className="eye eye-right" />

            <div className="mouth" />
          </div>

          <div className="technician-body">
            <span>+</span>
          </div>

          <div className="arm arm-left">
            <div className="hand" />
          </div>

          <div className="arm arm-right">
            <div className="hand" />
          </div>

          <div className="leg leg-left">
            <div className="shoe" />
          </div>

          <div className="leg leg-right">
            <div className="shoe" />
          </div>

          <div className="tool">
            <div className="tool-screen">
              WiFi
            </div>

            <div className="tool-handle" />
          </div>
        </div>

        {/* Moving cable */}

        <div className="network-cable">
          <div className="network-plug" />
        </div>
      </div>

      {/* =====================================================
          CSS
      ====================================================== */}

      <style jsx>{`
        .attendance-card {
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.05);
        }

        .success-box {
          animation: successIn 0.45s ease;
        }

        .map-preview {
          animation: mapOpen 0.25s ease;
        }

        .submit-button {
          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease;
        }

        .submit-button:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(34, 197, 94, 0.2);
        }

        /* =============================================
           GAME WORLD
        ============================================= */

        .game-world {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 125px;
          overflow: hidden;
          pointer-events: none;
          z-index: 2;
        }

        .game-ground {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 48px;
          background: #111827;
          border-top: 4px solid #374151;
        }

        .game-ground::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.3;
          background-image:
            linear-gradient(
              90deg,
              #4b5563 1px,
              transparent 1px
            ),
            linear-gradient(
              #4b5563 1px,
              transparent 1px
            );
          background-size: 35px 22px;
        }

        .road-line {
          position: absolute;
          width: 45px;
          height: 3px;
          background: #6b7280;
          bottom: 21px;
          animation: roadMove 2.5s linear infinite;
        }

        .road-line-1 {
          left: 10%;
        }

        .road-line-2 {
          left: 35%;
        }

        .road-line-3 {
          left: 60%;
        }

        .road-line-4 {
          left: 85%;
        }

        /* =============================================
           WIFI TOWER
        ============================================= */

        .wifi-tower {
          position: absolute;
          right: 7%;
          bottom: 43px;
          width: 70px;
          height: 75px;
        }

        .tower-head {
          position: absolute;
          left: 31px;
          top: 7px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--color-accent);
        }

        .tower-light {
          position: absolute;
          left: 33px;
          top: 0;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 9px #ef4444;
          animation: towerBlink 1s infinite;
        }

        .tower-body {
          position: absolute;
          left: 26px;
          top: 18px;
          width: 20px;
          height: 58px;
          border-left: 3px solid #6b7280;
          border-right: 3px solid #6b7280;
          transform: perspective(80px) rotateX(-8deg);
        }

        .tower-body div {
          height: 14px;
          border-bottom: 2px solid #6b7280;
          transform: rotate(-15deg);
        }

        .tower-wave {
          position: absolute;
          left: 35px;
          top: 11px;
          border: 2px solid var(--color-accent);
          border-left-color: transparent;
          border-bottom-color: transparent;
          border-radius: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          animation: towerWave 2s ease-out infinite;
        }

        .wave-1 {
          width: 25px;
          height: 25px;
        }

        .wave-2 {
          width: 45px;
          height: 45px;
          animation-delay: 0.3s;
        }

        .wave-3 {
          width: 65px;
          height: 65px;
          animation-delay: 0.6s;
        }

        /* =============================================
           ROUTER
        ============================================= */

        .mini-router {
          position: absolute;
          right: 20%;
          bottom: 45px;
          width: 68px;
          height: 34px;
          border: 2px solid #9ca3af;
          background: #f3f4f6;
          border-radius: 7px;
          box-shadow: 0 5px 0 rgba(15, 23, 42, 0.3);
          animation: routerFloat 2s ease-in-out infinite;
        }

        .mini-router span {
          display: inline-block;
          width: 5px;
          height: 5px;
          margin-left: 6px;
          margin-top: 18px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 5px #22c55e;
          animation: routerBlink 0.9s infinite;
        }

        .mini-router span:nth-child(2) {
          animation-delay: 0.25s;
        }

        .mini-router span:nth-child(3) {
          animation-delay: 0.5s;
        }

        .mini-router small {
          position: absolute;
          right: 5px;
          bottom: 5px;
          color: #374151;
          font-size: 6px;
          font-weight: 800;
        }

        .router-antenna {
          position: absolute;
          top: -16px;
          width: 3px;
          height: 18px;
          background: #6b7280;
          border-radius: 3px;
        }

        .router-antenna.left {
          left: 13px;
          transform: rotate(-15deg);
        }

        .router-antenna.right {
          right: 13px;
          transform: rotate(15deg);
        }

        /* =============================================
           COINS
        ============================================= */

        .wifi-coin {
          position: absolute;
          bottom: 78px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #1d4ed8;
          color: #bfdbfe;
          border: 2px solid #60a5fa;
          font-size: 14px;
          font-weight: 900;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
          animation: coinBounce 1.4s ease-in-out infinite;
        }

        .coin-1 {
          left: 30%;
        }

        .coin-2 {
          left: 43%;
          bottom: 91px;
          animation-delay: 0.2s;
        }

        .coin-3 {
          left: 56%;
          animation-delay: 0.4s;
        }

        /* =============================================
           TECHNICIAN
        ============================================= */

        .wifi-technician {
          position: absolute;
          left: -100px;
          bottom: 43px;
          width: 65px;
          height: 86px;
          animation: technicianTravel 12s linear infinite;
        }

        .tech-shadow {
          position: absolute;
          bottom: -3px;
          left: 14px;
          width: 44px;
          height: 7px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.25);
          animation: shadowMove 0.45s steps(2) infinite;
        }

        .backpack {
          position: absolute;
          left: 3px;
          top: 36px;
          width: 19px;
          height: 33px;
          background: #374151;
          border: 2px solid #111827;
          border-radius: 5px;
        }

        .technician-cap {
          position: absolute;
          left: 16px;
          top: 3px;
          width: 38px;
          height: 13px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 8px 8px 2px 2px;
          background: #2563eb;
          border: 2px solid #1e40af;
          color: white;
          font-size: 8px;
          font-weight: 900;
          z-index: 4;
        }

        .technician-cap::before {
          content: "";
          position: absolute;
          left: -6px;
          bottom: -4px;
          width: 19px;
          height: 5px;
          border-radius: 5px;
          background: #1e40af;
        }

        .technician-head {
          position: absolute;
          left: 20px;
          top: 13px;
          width: 31px;
          height: 31px;
          border-radius: 9px 9px 12px 12px;
          background: #f2b27b;
          border: 2px solid #9a5b35;
          z-index: 3;
        }

        .hair {
          position: absolute;
          left: -1px;
          top: -1px;
          width: 29px;
          height: 8px;
          border-radius: 8px 8px 2px 2px;
          background: #292524;
        }

        .eye {
          position: absolute;
          top: 14px;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #111827;
        }

        .eye-left {
          left: 7px;
        }

        .eye-right {
          right: 7px;
        }

        .mouth {
          position: absolute;
          bottom: 6px;
          left: 11px;
          width: 7px;
          height: 3px;
          border-bottom: 2px solid #92400e;
        }

        .technician-body {
          position: absolute;
          left: 15px;
          top: 43px;
          width: 40px;
          height: 31px;
          border-radius: 7px;
          border: 2px solid #1e40af;
          background: #2563eb;
          z-index: 2;
        }

        .technician-body span {
          position: absolute;
          left: 50%;
          top: 5px;
          transform: translateX(-50%);
          color: white;
          font-size: 15px;
          font-weight: 900;
        }

        .arm {
          position: absolute;
          top: 46px;
          width: 10px;
          height: 27px;
          border-radius: 7px;
          background: #2563eb;
          border: 2px solid #1e40af;
        }

        .arm-left {
          left: 9px;
          transform-origin: top;
          animation: armLeft 0.45s steps(2) infinite;
        }

        .arm-right {
          right: 5px;
          transform-origin: top;
          animation: armRight 0.45s steps(2) infinite;
        }

        .hand {
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f2b27b;
        }

        .leg {
          position: absolute;
          top: 71px;
          width: 13px;
          height: 20px;
          border-radius: 0 0 5px 5px;
          background: #1f2937;
          transform-origin: top;
        }

        .leg-left {
          left: 18px;
          animation: legLeft 0.45s steps(2) infinite;
        }

        .leg-right {
          left: 37px;
          animation: legRight 0.45s steps(2) infinite;
        }

        .shoe {
          position: absolute;
          bottom: -4px;
          left: -2px;
          width: 17px;
          height: 7px;
          border-radius: 6px;
          background: #111827;
        }

        .tool {
          position: absolute;
          right: -14px;
          top: 43px;
          width: 21px;
          height: 29px;
          animation: toolSwing 0.45s steps(2) infinite;
        }

        .tool-screen {
          width: 21px;
          height: 17px;
          border-radius: 4px;
          background: #111827;
          border: 2px solid #6b7280;
          color: #22c55e;
          font-size: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tool-handle {
          margin: 0 auto;
          width: 5px;
          height: 11px;
          border-radius: 2px;
          background: #6b7280;
        }

        /* =============================================
           NETWORK CABLE
        ============================================= */

        .network-cable {
          position: absolute;
          left: 60%;
          bottom: 42px;
          width: 170px;
          height: 25px;
          border-bottom: 3px solid #22c55e;
          border-radius: 0 0 80px 80px;
          opacity: 0.7;
          animation: cableGlow 1.4s ease-in-out infinite;
        }

        .network-plug {
          position: absolute;
          right: -3px;
          bottom: -5px;
          width: 13px;
          height: 9px;
          border-radius: 2px;
          background: #22c55e;
        }

        /* =============================================
           KEYFRAMES
        ============================================= */

        @keyframes technicianTravel {
          from {
            left: -100px;
          }

          to {
            left: calc(100% + 80px);
          }
        }

        @keyframes legLeft {
          0%,
          100% {
            transform: rotate(22deg);
          }

          50% {
            transform: rotate(-24deg);
          }
        }

        @keyframes legRight {
          0%,
          100% {
            transform: rotate(-24deg);
          }

          50% {
            transform: rotate(22deg);
          }
        }

        @keyframes armLeft {
          0%,
          100% {
            transform: rotate(-25deg);
          }

          50% {
            transform: rotate(20deg);
          }
        }

        @keyframes armRight {
          0%,
          100% {
            transform: rotate(20deg);
          }

          50% {
            transform: rotate(-25deg);
          }
        }

        @keyframes toolSwing {
          0%,
          100% {
            transform: rotate(-15deg);
          }

          50% {
            transform: rotate(12deg);
          }
        }

        @keyframes shadowMove {
          0%,
          100% {
            transform: scaleX(1);
          }

          50% {
            transform: scaleX(0.8);
          }
        }

        @keyframes coinBounce {
          0%,
          100% {
            transform: translateY(0) rotateY(0deg);
          }

          50% {
            transform: translateY(-8px) rotateY(180deg);
          }
        }

        @keyframes roadMove {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-120px);
          }
        }

        @keyframes routerFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes routerBlink {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: 0.2;
          }
        }

        @keyframes towerBlink {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: 0.15;
          }
        }

        @keyframes towerWave {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%)
              rotate(-45deg)
              scale(0.6);
          }

          30% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translate(-50%, -50%)
              rotate(-45deg)
              scale(1.2);
          }
        }

        @keyframes cableGlow {
          0%,
          100% {
            opacity: 0.35;
            filter: brightness(1);
          }

          50% {
            opacity: 1;
            filter: brightness(1.5);
          }
        }

        @keyframes mapOpen {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes successIn {
          from {
            opacity: 0;
            transform: scale(0.92);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 640px) {
          .game-world {
            height: 105px;
          }

          .wifi-tower {
            display: none;
          }

          .mini-router {
            right: 5%;
          }

          .coin-1 {
            left: 25%;
          }

          .coin-2 {
            left: 48%;
          }

          .coin-3 {
            display: none;
          }

          .network-cable {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

