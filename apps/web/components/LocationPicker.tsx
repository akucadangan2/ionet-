// components/LocationPicker.tsx
"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16);
  }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { "Accept-Language": "id" } }
    );
    const data = await res.json();
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number, address?: string) => void;
}

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [shouldRecenter, setShouldRecenter] = useState(false);

  const fallbackCenter: [number, number] = [-5.45, 105.27];
  const center: [number, number] = latitude && longitude ? [latitude, longitude] : fallbackCenter;

  async function handleSearch() {
    if (!search) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1&countrycodes=id&addressdetails=1`,
        { headers: { "Accept-Language": "id" } }
      );
      const results = await res.json();
      if (results[0]) {
        onChange(parseFloat(results[0].lat), parseFloat(results[0].lon), results[0].display_name);
        setShouldRecenter(true);
      } else {
        alert("Alamat tidak ditemukan, coba kata kunci lain (misal nama jalan + kelurahan)");
      }
    } catch {
      alert("Gagal mencari alamat, cek koneksi internet");
    } finally {
      setSearching(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung geolocation");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        onChange(lat, lng); // set titik dulu biar peta langsung respon
        setShouldRecenter(true);
        setResolvingAddress(true);
        const address = await reverseGeocode(lat, lng);
        setResolvingAddress(false);
        if (address) onChange(lat, lng, address);
      },
      () => alert("Gagal ambil lokasi, pastikan izin lokasi browser diaktifkan")
    );
  }

  async function handleMapClick(lat: number, lng: number) {
    onChange(lat, lng); // set titik dulu, biar marker langsung pindah tanpa nunggu
    setShouldRecenter(false);
    setResolvingAddress(true);
    const address = await reverseGeocode(lat, lng);
    setResolvingAddress(false);
    if (address) onChange(lat, lng, address);
  }

  const inputStyle = {
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    padding: "8px 12px",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input
          placeholder="Cari alamat (misal: Jl. Sudirman, Bandar Lampung)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="px-3 py-2 rounded text-sm"
          style={{ border: "1px solid var(--color-border)" }}
        >
          {searching ? "..." : "Cari"}
        </button>
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="px-3 py-2 rounded text-sm whitespace-nowrap"
          style={{ border: "1px solid var(--color-border)" }}
        >
          📍 Lokasi Saya
        </button>
      </div>

      <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--color-border)" }}>
        <MapContainer center={center} zoom={latitude ? 16 : 12} style={{ height: 260, width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClickHandler onPick={handleMapClick} />
          {shouldRecenter && latitude && longitude && <RecenterMap lat={latitude} lng={longitude} />}
          {latitude && longitude && <Marker position={[latitude, longitude]} icon={markerIcon} />}
        </MapContainer>
      </div>

      <p className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>
        {resolvingAddress
          ? "Mencari nama alamat..."
          : "Klik di peta buat pilih titik lokasi persis, alamat otomatis terisi."}
        {latitude && longitude && !resolvingAddress && ` (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`}
      </p>
    </div>
  );
}