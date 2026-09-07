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

        if (
          staffResult.data &&
          staffResult.data.role !== "super_admin"
        ) {
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
            )}

            {!checkingUser &&
              belumLink && (
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
          GAME / WIFI TECHNICIAN AREA
      ====================================================== */}

      <section
        className="game-world"
        aria-hidden="true"
      >
        <div className="game-sky-line" />

        <div className="wifi-coin coin-one">
          +
        </div>

        <div className="wifi-coin coin-two">
          +
        </div>

        <div className="wifi-coin coin-three">
          +
        </div>

        {/* WIFI ROUTER */}

        <div className="mini-router">
          <div className="router-antenna antenna-left" />
          <div className="router-antenna antenna-right" />

          <span />
          <span />
          <span />

          <small>
            WiFi
          </small>

          <div className="router-wave wave-a" />
          <div className="router-wave wave-b" />
        </div>

        {/* TECHNICIAN */}

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
            <span>
              +
            </span>
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

        {/* ROAD */}

        <div className="game-ground">
          <div className="road-line road-line-1" />
          <div className="road-line road-line-2" />
          <div className="road-line road-line-3" />
          <div className="road-line road-line-4" />
        </div>
      </section>

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
           GAME WORLD
        ================================================== */

        .game-world {
          position: relative;
          width: 100%;
          height: 145px;
          overflow: hidden;
          margin-top: 15px;
          background: linear-gradient(
            to bottom,
            rgba(59, 130, 246, 0.04),
            rgba(59, 130, 246, 0.09)
          );
          pointer-events: none;
        }

        .game-sky-line {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 46px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(59, 130, 246, 0.15),
            transparent
          );
        }

        .game-ground {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 46px;
          background: #111827;
          border-top: 3px solid #374151;
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
          background-size: 32px 19px;
        }

        .road-line {
          position: absolute;
          bottom: 19px;
          width: 40px;
          height: 3px;
          background: #6b7280;
          animation: roadMove 2.2s linear infinite;
        }

        .road-line-1 {
          left: 5%;
        }

        .road-line-2 {
          left: 30%;
        }

        .road-line-3 {
          left: 58%;
        }

        .road-line-4 {
          left: 85%;
        }

        /* =================================================
           ROUTER
        ================================================== */

        .mini-router {
          position: absolute;
          right: 10%;
          bottom: 48px;
          width: 64px;
          height: 34px;
          border: 2px solid #9ca3af;
          border-radius: 7px;
          background: #f3f4f6;
          box-shadow: 0 5px 0 rgba(15, 23, 42, 0.25);
          animation: routerFloat 2s ease-in-out infinite;
        }

        .mini-router span {
          display: inline-block;
          width: 5px;
          height: 5px;
          margin-left: 5px;
          margin-top: 18px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 5px #22c55e;
          animation: routerBlink 0.9s infinite;
        }

        .mini-router span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .mini-router span:nth-child(3) {
          animation-delay: 0.4s;
        }

        .mini-router small {
          position: absolute;
          right: 5px;
          bottom: 5px;
          font-size: 6px;
          font-weight: 800;
          color: #374151;
        }

        .router-antenna {
          position: absolute;
          top: -15px;
          width: 3px;
          height: 17px;
          border-radius: 3px;
          background: #6b7280;
        }

        .antenna-left {
          left: 13px;
          transform: rotate(-15deg);
        }

        .antenna-right {
          right: 13px;
          transform: rotate(15deg);
        }

        .router-wave {
          position: absolute;
          left: 50%;
          top: -16px;
          border: 2px solid #3b82f6;
          border-left-color: transparent;
          border-bottom-color: transparent;
          border-radius: 50%;
          transform: translateX(-50%) rotate(-45deg);
          animation: wifiWave 1.5s ease-out infinite;
        }

        .wave-a {
          width: 30px;
          height: 30px;
        }

        .wave-b {
          width: 45px;
          height: 45px;
          animation-delay: 0.4s;
        }

        /* =================================================
           COINS
        ================================================== */

        .wifi-coin {
          position: absolute;
          bottom: 74px;
          width: 23px;
          height: 23px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #1d4ed8;
          border: 2px solid #60a5fa;
          color: #bfdbfe;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.45);
          animation: coinBounce 1.4s ease-in-out infinite;
        }

        .coin-one {
          left: 29%;
        }

        .coin-two {
          left: 47%;
          bottom: 88px;
          animation-delay: 0.25s;
        }

        .coin-three {
          left: 64%;
          animation-delay: 0.5s;
        }

        /* =================================================
           TECHNICIAN
        ================================================== */

        .wifi-technician {
          position: absolute;
          left: -80px;
          bottom: 45px;
          width: 62px;
          height: 85px;
          animation: technicianTravel 11s linear infinite;
        }

        .tech-shadow {
          position: absolute;
          bottom: -2px;
          left: 13px;
          width: 42px;
          height: 6px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.23);
          animation: shadowMove 0.45s steps(2) infinite;
        }

        .backpack {
          position: absolute;
          left: 3px;
          top: 35px;
          width: 18px;
          height: 32px;
          border: 2px solid #111827;
          border-radius: 5px;
          background: #374151;
        }

        .technician-cap {
          position: absolute;
          left: 15px;
          top: 3px;
          width: 37px;
          height: 13px;
          border-radius: 8px 8px 2px 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2563eb;
          border: 2px solid #1e40af;
          color: white;
          font-size: 8px;
          font-weight: 900;
          z-index: 5;
        }

        .technician-cap::before {
          content: "";
          position: absolute;
          left: -6px;
          bottom: -4px;
          width: 18px;
          height: 5px;
          border-radius: 5px;
          background: #1e40af;
        }

        .technician-head {
          position: absolute;
          left: 19px;
          top: 13px;
          width: 30px;
          height: 31px;
          border: 2px solid #9a5b35;
          border-radius: 9px 9px 12px 12px;
          background: #f2b27b;
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
          left: 10px;
          bottom: 6px;
          width: 7px;
          height: 3px;
          border-bottom: 2px solid #92400e;
        }

        .technician-body {
          position: absolute;
          left: 14px;
          top: 43px;
          width: 39px;
          height: 31px;
          border: 2px solid #1e40af;
          border-radius: 7px;
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
          height: 26px;
          border-radius: 7px;
          border: 2px solid #1e40af;
          background: #2563eb;
          transform-origin: top;
        }

        .arm-left {
          left: 8px;
          animation: armLeft 0.45s steps(2) infinite;
        }

        .arm-right {
          right: 5px;
          animation: armRight 0.45s steps(2) infinite;
        }

        .hand {
          position: absolute;
          left: 0;
          bottom: -5px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f2b27b;
        }

        .leg {
          position: absolute;
          top: 71px;
          width: 13px;
          height: 19px;
          border-radius: 0 0 5px 5px;
          background: #1f2937;
          transform-origin: top;
        }

        .leg-left {
          left: 17px;
          animation: legLeft 0.45s steps(2) infinite;
        }

        .leg-right {
          left: 36px;
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
          border: 2px solid #6b7280;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #111827;
          color: #22c55e;
          font-size: 5px;
        }

        .tool-handle {
          width: 5px;
          height: 11px;
          margin: 0 auto;
          border-radius: 2px;
          background: #6b7280;
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

          /*
           * BUKAN FIXED.
           * Animasi menjadi bagian halaman sehingga
           * tidak terpotong / menutupi tombol di HP.
           */
          .game-world {
            position: relative;
            height: 105px;
            margin-top: 8px;
            overflow: hidden;
          }

          .game-ground {
            height: 35px;
          }

          .game-sky-line {
            bottom: 35px;
          }

          .road-line {
            bottom: 14px;
            width: 30px;
          }

          .mini-router {
            right: 5%;
            bottom: 37px;
            transform: scale(0.78);
            transform-origin: bottom right;
          }

          .wifi-technician {
            bottom: 34px;
            transform: scale(0.78);
            transform-origin: bottom left;
            animation: technicianTravelMobile 8.5s linear infinite;
          }

          .wifi-coin {
            transform: scale(0.78);
          }

          .coin-one {
            left: 26%;
            bottom: 57px;
          }

          .coin-two {
            left: 48%;
            bottom: 68px;
          }

          .coin-three {
            left: 67%;
            bottom: 56px;
          }
        }

        @media (max-width: 380px) {
          .game-world {
            height: 92px;
          }

          .game-ground {
            height: 31px;
          }

          .game-sky-line {
            bottom: 31px;
          }

          .wifi-technician {
            bottom: 30px;
            transform: scale(0.68);
            animation: technicianTravelMobileSmall 7.8s linear infinite;
          }

          .mini-router {
            bottom: 32px;
            transform: scale(0.66);
          }

          .wifi-coin {
            transform: scale(0.65);
          }

          .coin-three {
            display: none;
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

        @keyframes technicianTravel {
          from {
            left: -80px;
          }

          to {
            left: calc(100% + 70px);
          }
        }

        @keyframes technicianTravelMobile {
          from {
            left: -60px;
          }

          to {
            left: calc(100% + 40px);
          }
        }

        @keyframes technicianTravelMobileSmall {
          from {
            left: -55px;
          }

          to {
            left: calc(100% + 30px);
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
            margin-top: 0;
          }

          50% {
            margin-top: -7px;
          }
        }

        @keyframes roadMove {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-90px);
          }
        }

        @keyframes routerFloat {
          0%,
          100% {
            margin-bottom: 0;
          }

          50% {
            margin-bottom: 4px;
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

        @keyframes wifiWave {
          0% {
            opacity: 0;
            scale: 0.7;
          }

          40% {
            opacity: 0.8;
          }

          100% {
            opacity: 0;
            scale: 1.25;
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

