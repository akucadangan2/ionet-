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
  Navigation,
  RefreshCw,
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
  const [locationLoading, setLocationLoading] = useState(false);

  const [showMap, setShowMap] = useState(false);
  const [copied, setCopied] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [role, setRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
        setIsLoggedIn(true);

        const staffResult = await supabase
          .from("staff")
          .select("role, karyawan_id, karyawan:karyawan_id(id, nama)")
          .eq("auth_user_id", user.id)
          .single();

        if (staffResult.data) {
          setRole(staffResult.data.role);

          if (staffResult.data.role !== "super_admin") {
            const karyawanRel =
              staffResult.data.karyawan as unknown as {
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
      }

      setCheckingUser(false);
    }

    load();
  }, []);

  /* =========================================================
     GPS
  ========================================================= */

  function requestLocation() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(
        "Browser ini tidak mendukung layanan lokasi."
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });

        setLocationError("");
        setLocationLoading(false);
      },

      function (error) {
        setLocationLoading(false);

        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Izin lokasi ditolak. Aktifkan izin lokasi untuk browser ini, lalu tekan Coba Lagi."
          );
        } else if (
          error.code === error.POSITION_UNAVAILABLE
        ) {
          setLocationError(
            "Lokasi tidak tersedia. Pastikan GPS perangkat aktif."
          );
        } else if (error.code === error.TIMEOUT) {
          setLocationError(
            "Pencarian lokasi terlalu lama. Pastikan GPS aktif lalu coba lagi."
          );
        } else {
          setLocationError(
            "Gagal mendapatkan lokasi perangkat."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  useEffect(function () {
    // Tetap coba otomatis saat halaman dibuka.
    // Kalau browser HP membutuhkan interaksi pengguna,
    // tombol GPS manual tetap tersedia.
    requestLocation();
  }, []);

  /* =========================================================
     CAMERA
  ========================================================= */

  useEffect(
    function () {
      if (
        cameraActive &&
        streamRef.current &&
        videoRef.current
      ) {
        videoRef.current.srcObject =
          streamRef.current;
      }
    },
    [cameraActive]
  );

  async function startCamera() {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
          },
        });

      streamRef.current = stream;
      setCameraActive(true);
      setErrorMsg("");
    } catch {
      setErrorMsg(
        "Gagal mengakses kamera. Pastikan izin kamera diaktifkan."
      );
    }
  }

  function takePhoto() {
    if (
      !videoRef.current ||
      !canvasRef.current
    ) {
      return;
    }

    const canvas = canvasRef.current;

    const maxWidth = 480;

    const scale = Math.min(
      1,
      maxWidth /
        videoRef.current.videoWidth
    );

    canvas.width =
      videoRef.current.videoWidth * scale;

    canvas.height =
      videoRef.current.videoHeight * scale;

    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(
        videoRef.current,
        0,
        0,
        canvas.width,
        canvas.height
      );

      setPhotoData(
        canvas.toDataURL(
          "image/jpeg",
          0.5
        )
      );
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach(function (track) {
          track.stop();
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

    try {
      await navigator.clipboard.writeText(
        `${location.lat}, ${location.lng}`
      );

      setCopied(true);

      setTimeout(function () {
        setCopied(false);
      }, 1500);
    } catch {
      setErrorMsg(
        "Gagal menyalin koordinat."
      );
    }
  }

  function getMapEmbedUrl() {
    if (!location) return "";

    const delta = 0.003;

    const left =
      location.lng - delta;
    const right =
      location.lng + delta;
    const top =
      location.lat + delta;
    const bottom =
      location.lat - delta;

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

    if (
      !selectedKaryawan ||
      !photoData ||
      !location
    ) {
      setErrorMsg(
        "Lengkapi nama, foto, dan pastikan lokasi terdeteksi."
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        "/api/absensi",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            karyawanId:
              selectedKaryawan,
            tipe,
            latitude:
              location.lat,
            longitude:
              location.lng,
            fotoBase64:
              photoData,
          }),
        }
      );

      const json =
        await res.json();

      if (!res.ok) {
        throw new Error(
          json.message
        );
      }

      setSuccess(true);
    } catch (err) {
      setErrorMsg(
        (err as Error).message
      );
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
          background:
            "var(--color-bg)",
        }}
      >
        <div className="text-center success-box">
          <CheckCircle
            size={54}
            color="var(--color-signal-good)"
            style={{
              margin:
                "0 auto 16px",
            }}
          />

          <h1 className="text-xl font-semibold mb-2">
            Absen Berhasil
          </h1>

          <p
            style={{
              color:
                "var(--color-ink-muted)",
            }}
          >
            Absen {tipe} tercatat
            pukul{" "}
            {new Date().toLocaleTimeString(
              "id-ID"
            )}
          </p>

          {location && (
            <button
              type="button"
              onClick={
                openGoogleMaps
              }
              className="mt-4 inline-flex items-center gap-2 text-sm"
              style={{
                color:
                  "var(--color-accent)",
              }}
            >
              <MapPin
                size={15}
              />
              Lihat lokasi
              absensi
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="attendance-page"
      style={{
        minHeight: "100vh",
        background:
          "var(--color-bg)",
      }}
    >
      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="attendance-content">
        <div className="attendance-container">
          <img
            src="/logo.png"
            alt="IONET Plus"
            className="main-logo"
          />

          <h1 className="text-xl font-semibold text-center mb-1">
            Absensi Karyawan
          </h1>

          <p
            className="text-xs text-center mb-6"
            style={{
              color:
                "var(--color-ink-muted)",
            }}
          >
            Pastikan foto dan lokasi
            sesuai sebelum melakukan
            absensi
          </p>

          <div
            className="rounded-xl p-5 attendance-card"
            style={{
              background:
                "var(--color-surface)",
              border:
                "1px solid var(--color-border)",
            }}
          >
            {/* =================================================
                NAMA KARYAWAN
            ================================================== */}

            <label
              className="text-xs font-medium mb-2 block"
              style={{
                color:
                  "var(--color-ink-muted)",
              }}
            >
              Nama Karyawan
            </label>

            {checkingUser ? (
              <p
                className="text-sm mb-4"
                style={{
                  color:
                    "var(--color-ink-muted)",
                }}
              >
                Memuat...
              </p>
            ) : !isLoggedIn || role === "super_admin" ? (
              <select
                value={
                  selectedKaryawan
                }
                onChange={function (
                  e
                ) {
                  setSelectedKaryawan(
                    e.target.value
                  );
                }}
                className="w-full mb-4"
                style={{
                  border:
                    "1px solid var(--color-border)",
                  borderRadius: 9,
                  padding:
                    "11px 14px",
                  background:
                    "var(--color-surface)",
                }}
              >
                <option value="">
                  - Pilih Nama -
                </option>

                {karyawanList.map(
                  function (k) {
                    return (
                      <option
                        key={
                          k.id
                        }
                        value={
                          k.id
                        }
                      >
                        {
                          k.nama
                        }
                      </option>
                    );
                  }
                )}
              </select>
            ) : lockedNama ? (
              <div
                className="w-full mb-4"
                style={{
                  border:
                    "1px solid var(--color-border)",
                  borderRadius: 9,
                  padding:
                    "11px 14px",
                  background:
                    "var(--color-bg)",
                  color:
                    "var(--color-ink)",
                }}
              >
                {lockedNama}
              </div>
            ) : (
              <p
                className="text-sm mb-4"
                style={{
                  color:
                    "var(--color-signal-bad)",
                }}
              >
                Akun kamu belum
                dihubungkan ke data
                Karyawan. Hubungi
                Super Admin untuk
                menghubungkan akun.
              </p>
            )}

            {/* =================================================
                TIPE ABSEN
            ================================================== */}

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={function () {
                  setTipe(
                    "masuk"
                  );
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{
                  background:
                    tipe ===
                    "masuk"
                      ? "var(--color-accent)"
                      : "transparent",

                  color:
                    tipe ===
                    "masuk"
                      ? "white"
                      : "var(--color-ink)",

                  border:
                    "1px solid var(--color-border)",
                }}
              >
                Absen Masuk
              </button>

              <button
                type="button"
                onClick={function () {
                  setTipe(
                    "pulang"
                  );
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{
                  background:
                    tipe ===
                    "pulang"
                      ? "var(--color-accent)"
                      : "transparent",

                  color:
                    tipe ===
                    "pulang"
                      ? "white"
                      : "var(--color-ink)",

                  border:
                    "1px solid var(--color-border)",
                }}
              >
                Absen Pulang
              </button>
            </div>

            {/* =================================================
                LOCATION
            ================================================== */}

            <div
              className="mb-4 rounded-xl overflow-hidden"
              style={{
                border:
                  "1px solid var(--color-border)",
                background:
                  "var(--color-bg)",
              }}
            >
              {!location ? (
                <div className="p-4">
                  <div className="flex gap-3 mb-4">
                    <div
                      className="location-icon"
                      style={{
                        background:
                          "rgba(239,68,68,0.08)",
                      }}
                    >
                      <MapPin
                        size={19}
                        color="var(--color-signal-bad)"
                      />
                    </div>

                    <div className="flex-1">
                      <div
                        className="text-sm font-medium mb-1"
                        style={{
                          color:
                            "var(--color-ink)",
                        }}
                      >
                        GPS belum
                        aktif
                      </div>

                      <p
                        className="text-xs leading-relaxed"
                        style={{
                          color:
                            "var(--color-ink-muted)",
                        }}
                      >
                        Aktifkan GPS
                        dan izinkan
                        browser
                        mengakses
                        lokasi untuk
                        melakukan
                        absensi.
                      </p>
                    </div>
                  </div>

                  {locationError && (
                    <div className="location-error">
                      {
                        locationError
                      }
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={
                      requestLocation
                    }
                    disabled={
                      locationLoading
                    }
                    className="gps-button"
                  >
                    {locationLoading ? (
                      <RefreshCw
                        size={16}
                        className="gps-spinner"
                      />
                    ) : (
                      <Navigation
                        size={16}
                      />
                    )}

                    {locationLoading
                      ? "Mendeteksi Lokasi..."
                      : locationError
                        ? "Coba Aktifkan GPS Lagi"
                        : "Aktifkan GPS / Izinkan Lokasi"}
                  </button>

                  <p
                    className="mt-3 text-center"
                    style={{
                      fontSize: 10,
                      lineHeight: 1.5,
                      color:
                        "var(--color-ink-muted)",
                    }}
                  >
                    Saat browser
                    meminta izin,
                    tekan{" "}
                    <strong>
                      Izinkan /
                      Allow
                    </strong>
                    .
                  </p>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={function () {
                      setShowMap(
                        !showMap
                      );
                    }}
                    className="w-full p-3 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="location-icon"
                        style={{
                          background:
                            "rgba(34,197,94,0.10)",
                        }}
                      >
                        <MapPin
                          size={18}
                          color="var(--color-signal-good)"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            Lokasi
                            terdeteksi
                          </span>

                          <span className="location-online" />
                        </div>

                        <p
                          className="text-xs mt-1"
                          style={{
                            color:
                              "var(--color-ink-muted)",
                          }}
                        >
                          {location.lat.toFixed(
                            6
                          )}
                          ,{" "}
                          {location.lng.toFixed(
                            6
                          )}
                        </p>

                        <p
                          className="mt-1"
                          style={{
                            fontSize: 10,
                            color:
                              "var(--color-accent)",
                          }}
                        >
                          Ketuk untuk
                          melihat peta
                        </p>
                      </div>

                      <Map
                        size={17}
                        style={{
                          color:
                            "var(--color-accent)",
                        }}
                      />
                    </div>
                  </button>

                  {showMap && (
                    <div className="map-preview">
                      <div className="map-wrapper">
                        <iframe
                          src={getMapEmbedUrl()}
                          title="Preview Lokasi Absensi"
                          width="100%"
                          height="100%"
                          style={{
                            border: 0,
                            display:
                              "block",
                          }}
                          loading="lazy"
                        />

                        <button
                          type="button"
                          onClick={function () {
                            setShowMap(
                              false
                            );
                          }}
                          className="map-close"
                        >
                          <X
                            size={15}
                          />
                        </button>
                      </div>

                      <div className="map-buttons">
                        <button
                          type="button"
                          onClick={
                            openGoogleMaps
                          }
                          className="google-maps-button"
                        >
                          <ExternalLink
                            size={14}
                          />

                          Google Maps
                        </button>

                        <button
                          type="button"
                          onClick={
                            copyCoordinate
                          }
                          className="copy-button"
                        >
                          <Copy
                            size={14}
                          />

                          {copied
                            ? "Tersalin"
                            : "Salin"}
                        </button>
                      </div>

                      <div className="px-3 pb-3">
                        <button
                          type="button"
                          onClick={
                            requestLocation
                          }
                          disabled={
                            locationLoading
                          }
                          className="refresh-location"
                        >
                          <RefreshCw
                            size={13}
                          />

                          {locationLoading
                            ? "Memperbarui..."
                            : "Perbarui Lokasi GPS"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* =================================================
                CAMERA
            ================================================== */}

            {!photoData &&
              !cameraActive && (
                <button
                  type="button"
                  onClick={
                    startCamera
                  }
                  className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  style={{
                    border:
                      "1px solid var(--color-accent)",
                    color:
                      "var(--color-accent)",
                  }}
                >
                  <Camera
                    size={16}
                  />
                  Ambil Foto Selfie
                </button>
              )}

            {cameraActive && (
              <div>
                <div className="camera-wrapper">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full"
                    style={{
                      transform:
                        "scaleX(-1)",
                      display:
                        "block",
                    }}
                  />

                  <svg
                    viewBox="0 0 300 400"
                    className="face-overlay"
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

                  <p className="face-guide-text">
                    Posisikan
                    wajah di
                    dalam
                    bingkai
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    takePhoto
                  }
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
                    transform:
                      "scaleX(-1)",
                  }}
                />

                <button
                  type="button"
                  onClick={function () {
                    setPhotoData(
                      null
                    );

                    startCamera();
                  }}
                  className="text-xs mb-3"
                  style={{
                    color:
                      "var(--color-accent)",
                  }}
                >
                  Ambil ulang
                  foto
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
                className="text-sm mt-3"
                style={{
                  color:
                    "var(--color-signal-bad)",
                }}
              >
                {errorMsg}
              </p>
            )}

            {/* =================================================
                SUBMIT
            ================================================== */}

            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={
                submitting ||
                !photoData ||
                !location ||
                !selectedKaryawan
              }
              className="w-full py-3 rounded-lg text-sm font-medium text-white mt-4 submit-button"
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
      </main>

      {/* =====================================================
          CSS
      ====================================================== */}

      <style jsx>{`
        .attendance-page {
          position: relative;
          overflow-x: hidden;
        }

        .attendance-content {
          padding: 24px 24px 30px;
        }

        .attendance-container {
          max-width: 420px;
          margin: 0 auto;
        }

        .main-logo {
          height: 34px;
          width: auto;
          object-fit: contain;
          margin: 0 auto 22px;
          display: block;
        }

        .attendance-card {
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.05);
        }

        .location-icon {
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .location-error {
          padding: 10px 12px;
          margin-bottom: 12px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.07);
          color: var(--color-signal-bad);
          font-size: 11px;
          line-height: 1.6;
        }

        .gps-button {
          width: 100%;
          padding: 11px 12px;
          border-radius: 9px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--color-accent);
          color: white;
          font-size: 13px;
          font-weight: 500;
        }

        .gps-button:disabled {
          opacity: 0.65;
        }

        .gps-spinner {
          animation: spin 0.8s linear infinite;
        }

        .location-online {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-signal-good);
          box-shadow: 0 0 7px rgba(34, 197, 94, 0.7);
          animation: onlinePulse 1.5s ease-in-out infinite;
        }

        .map-preview {
          border-top: 1px solid var(--color-border);
          animation: mapOpen 0.25s ease;
        }

        .map-wrapper {
          height: 190px;
          position: relative;
          background: #e5e7eb;
        }

        .map-close {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: none;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .map-buttons {
          display: flex;
          gap: 8px;
          padding: 12px;
        }

        .google-maps-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px;
          border: none;
          border-radius: 8px;
          background: var(--color-accent);
          color: white;
          font-size: 12px;
          font-weight: 500;
        }

        .copy-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 13px;
          border-radius: 8px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-ink);
          font-size: 12px;
          font-weight: 500;
        }

        .refresh-location {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-accent);
          font-size: 11px;
        }

        .camera-wrapper {
          position: relative;
          margin-bottom: 12px;
          overflow: hidden;
          border-radius: 12px;
        }

        .face-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .face-guide-text {
          position: absolute;
          bottom: 12px;
          left: 0;
          right: 0;
          text-align: center;
          color: white;
          font-size: 12px;
          font-weight: 500;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
        }

        .success-box {
          animation: successIn 0.45s ease;
        }

        /* =================================================
           MOBILE
        ================================================== */

        @media (max-width: 640px) {
          .attendance-content {
            padding: 18px 14px 18px;
          }

          .attendance-card {
            padding: 16px;
          }

          .main-logo {
            height: 30px;
            margin-bottom: 18px;
          }

          .map-wrapper {
            height: 165px;
          }

          .map-buttons {
            flex-direction: column;
          }

          .copy-button,
          .google-maps-button {
            width: 100%;
          }

        }

        /* =================================================
           ANIMATIONS
        ================================================== */

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes onlinePulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: 0.45;
            transform: scale(0.75);
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