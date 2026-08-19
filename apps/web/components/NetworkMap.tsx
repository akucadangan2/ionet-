// components/NetworkMap.tsx
"use client";
import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Polyline, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function mapboxUrl(styleId: string) {
  return "https://api.mapbox.com/styles/v1/mapbox/" + styleId + "/tiles/{z}/{x}/{y}?access_token=" + MAPBOX_TOKEN;
}

function makeIcon(color: string, shape: "circle" | "diamond" = "circle") {
  const style =
    shape === "diamond"
      ? "width:14px;height:14px;background:" + color + ";border:2px solid white;box-shadow:0 0 8px rgba(0,0,0,0.35);transform:rotate(45deg)"
      : "width:16px;height:16px;border-radius:50%;background:" + color + ";border:2px solid white;box-shadow:0 0 8px rgba(0,0,0,0.35)";
  return new L.DivIcon({ className: "", html: '<div style="' + style + '"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
}

const iconOnline = makeIcon("#2FAE60");
const iconOffline = makeIcon("#D64545");
const iconHijau = makeIcon("#2FAE60");
const iconKuning = makeIcon("#E8B923");
const iconBiru = makeIcon("#3B82F6");
const iconMerah = makeIcon("#D64545");
const iconAbu = makeIcon("#9CA3AF");
const iconDefault = makeIcon("#6B7280");
const iconOdc = makeIcon("#8B5CF6", "diamond");
const iconOdp = makeIcon("#F59E0B", "diamond");

function getIconByKategori(kategori?: string) {
  if (!kategori) return iconDefault;
  if (kategori.indexOf("Hijau") === 0) return iconHijau;
  if (kategori.indexOf("Kuning") === 0) return iconKuning;
  if (kategori.indexOf("Biru") === 0) return iconBiru;
  if (kategori.indexOf("Merah") === 0) return iconMerah;
  if (kategori.indexOf("Abu") === 0) return iconAbu;
  return iconDefault;
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

interface RouterPin {
  id: string;
  nama: string;
  latitude: number;
  longitude: number;
  status: "online" | "offline";
}

interface PelangganPin {
  id: string;
  nama: string;
  latitude: number;
  longitude: number;
  status: string;
  rxPower?: number;
  txPower?: number;
  kmlKategori?: string;
  kmlDeskripsi?: string;
}

interface TitikJaringanPin {
  id: string;
  nama: string;
  tipe: string;
  kapasitas_port: number | null;
  port_terpakai: number | null;
  latitude: number;
  longitude: number;
  keterangan: string | null;
}

interface JalurKabelLine {
  id: string;
  nama: string;
  warna: string;
  koordinat: [number, number][];
}

interface NetworkMapProps {
  routers: RouterPin[];
  pelanggan: PelangganPin[];
  titikJaringan?: TitikJaringanPin[];
  jalurKabel?: JalurKabelLine[];
  center: [number, number];
}

const legendPanelStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 16,
  left: 16,
  zIndex: 1000,
  background: "rgba(255,255,255,0.97)",
  backdropFilter: "blur(6px)",
  borderRadius: 12,
  padding: "14px 16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  fontSize: 12,
  maxWidth: 220,
};

const layerPanelStyle: React.CSSProperties = {
  position: "absolute",
  top: 16,
  left: 16,
  zIndex: 1000,
  background: "rgba(255,255,255,0.97)",
  backdropFilter: "blur(6px)",
  borderRadius: 12,
  padding: "12px 16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  fontSize: 12,
};

function LegendDot(props: { color: string; label: string; shape?: "circle" | "diamond" }) {
  const shape = props.shape || "circle";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <span
        style={{
          width: 10,
          height: 10,
          background: props.color,
          borderRadius: shape === "circle" ? "50%" : 2,
          transform: shape === "diamond" ? "rotate(45deg)" : "none",
          flexShrink: 0,
        }}
      />
      <span style={{ color: "#444" }}>{props.label}</span>
    </div>
  );
}

export default function NetworkMap({ routers, pelanggan, titikJaringan, jalurKabel, center }: NetworkMapProps) {
  const [showRouter, setShowRouter] = useState(true);
  const [showPelanggan, setShowPelanggan] = useState(true);
  const [showTitik, setShowTitik] = useState(true);
  const [showJalur, setShowJalur] = useState(true);

  const jumlahOdc = (titikJaringan || []).filter(function (t) { return t.tipe === "odc"; }).length;
  const jumlahOdp = (titikJaringan || []).filter(function (t) { return t.tipe === "odp"; }).length;

  const hasMapbox = Boolean(MAPBOX_TOKEN);

  return (
    <div style={{ position: "relative" }}>
      <MapContainer center={center} zoom={15} zoomControl={false} style={{ height: "600px", width: "100%" }}>
        <ZoomControl position="bottomright" />

        <LayersControl position="topright">
          {hasMapbox && (
            <LayersControl.BaseLayer checked name="Mapbox Streets">
              <TileLayer url={mapboxUrl("streets-v12")} attribution="&copy; Mapbox &copy; OpenStreetMap" tileSize={512} zoomOffset={-1} maxZoom={22} />
            </LayersControl.BaseLayer>
          )}
          {hasMapbox && (
            <LayersControl.BaseLayer name="Mapbox Satelit">
              <TileLayer url={mapboxUrl("satellite-streets-v12")} attribution="&copy; Mapbox &copy; OpenStreetMap" tileSize={512} zoomOffset={-1} maxZoom={22} />
            </LayersControl.BaseLayer>
          )}
          {hasMapbox && (
            <LayersControl.BaseLayer name="Mapbox Navigasi Malam">
              <TileLayer url={mapboxUrl("navigation-night-v1")} attribution="&copy; Mapbox &copy; OpenStreetMap" tileSize={512} zoomOffset={-1} maxZoom={22} />
            </LayersControl.BaseLayer>
          )}
          {hasMapbox && (
            <LayersControl.BaseLayer name="Mapbox Outdoor">
              <TileLayer url={mapboxUrl("outdoors-v12")} attribution="&copy; Mapbox &copy; OpenStreetMap" tileSize={512} zoomOffset={-1} maxZoom={22} />
            </LayersControl.BaseLayer>
          )}
          <LayersControl.BaseLayer checked={!hasMapbox} name="Peta Jalan (Gratis)">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satelit Esri (Gratis)">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" />
          </LayersControl.BaseLayer>
        </LayersControl>

        {showJalur &&
          (jalurKabel || []).map(function (j) {
            return (
              <Polyline key={j.id} positions={j.koordinat} pathOptions={{ color: j.warna, weight: 4, opacity: 0.85 }}>
                <Popup>
                  <b>{j.nama}</b>
                  <br />
                  Jalur kabel fiber optik
                </Popup>
              </Polyline>
            );
          })}

        {showRouter &&
          routers.map(function (r) {
            return (
              <Marker key={r.id} position={[r.latitude, r.longitude]} icon={r.status === "online" ? iconOnline : iconOffline}>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <b>{r.nama}</b>
                    <br />
                    Jenis: Router / Perangkat Pusat
                    <br />
                    Status:{" "}
                    <span style={{ color: r.status === "online" ? "#2FAE60" : "#D64545", fontWeight: 600 }}>
                      {r.status === "online" ? "Online" : "Offline"}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {showPelanggan &&
          pelanggan.map(function (p) {
            const cleanDeskripsi = p.kmlDeskripsi ? stripHtmlTags(p.kmlDeskripsi) : "";
            return (
              <Marker key={p.id} position={[p.latitude, p.longitude]} icon={getIconByKategori(p.kmlKategori)}>
                <Popup>
                  <div style={{ minWidth: 200, maxWidth: 260 }}>
                    <b>{p.nama}</b>
                    <br />
                    Jenis: Pelanggan
                    <br />
                    Status: {p.status}
                    {p.kmlKategori && (
                      <>
                        <br />
                        Kategori: {p.kmlKategori}
                      </>
                    )}
                    {p.rxPower !== undefined && (
                      <>
                        <br />
                        Sinyal Rx: {p.rxPower} dBm{p.txPower !== undefined && p.txPower !== null ? " \u00b7 Tx: " + p.txPower + " dBm" : ""}
                      </>
                    )}
                    {cleanDeskripsi && (
                      <>
                        <hr style={{ margin: "6px 0" }} />
                        <div style={{ fontSize: 11, whiteSpace: "pre-wrap", color: "#555" }}>{cleanDeskripsi}</div>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {showTitik &&
          (titikJaringan || []).map(function (t) {
            return (
              <Marker key={t.id} position={[t.latitude, t.longitude]} icon={t.tipe === "odc" ? iconOdc : iconOdp}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <b>{t.nama}</b>
                    <br />
                    Jenis: {t.tipe.toUpperCase()} (Infrastruktur Jaringan)
                    {t.kapasitas_port !== null && (
                      <>
                        <br />
                        Kapasitas Port: {t.port_terpakai || 0} / {t.kapasitas_port} terpakai
                      </>
                    )}
                    {t.keterangan && (
                      <>
                        <hr style={{ margin: "6px 0" }} />
                        <div style={{ fontSize: 11, color: "#555" }}>{t.keterangan}</div>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      <div style={layerPanelStyle}>
        <p style={{ fontWeight: 600, marginBottom: 8, color: "#333" }}>Layer Data</p>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, cursor: "pointer" }}>
          <input type="checkbox" checked={showRouter} onChange={function () { setShowRouter(!showRouter); }} />
          Router ({routers.length})
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, cursor: "pointer" }}>
          <input type="checkbox" checked={showPelanggan} onChange={function () { setShowPelanggan(!showPelanggan); }} />
          Pelanggan ({pelanggan.length})
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, cursor: "pointer" }}>
          <input type="checkbox" checked={showTitik} onChange={function () { setShowTitik(!showTitik); }} />
          ODC/ODP ({(titikJaringan || []).length})
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={showJalur} onChange={function () { setShowJalur(!showJalur); }} />
          Jalur Kabel ({(jalurKabel || []).length})
        </label>
      </div>

      <div style={legendPanelStyle}>
        <p style={{ fontWeight: 600, marginBottom: 8, color: "#333" }}>Legenda</p>
        <LegendDot color="#2FAE60" label="Router / Pelanggan Online" />
        <LegendDot color="#D64545" label="Router / Pelanggan Offline" />
        <LegendDot color="#E8B923" label="Aktif + Reseller Voucher" />
        <LegendDot color="#3B82F6" label="Titik Modem Hotspot" />
        <LegendDot color="#9CA3AF" label="Pelanggan Tidak Aktif" />
        <LegendDot color="#8B5CF6" label={"ODC (" + jumlahOdc + " titik)"} shape="diamond" />
        <LegendDot color="#F59E0B" label={"ODP (" + jumlahOdp + " titik)"} shape="diamond" />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          <span style={{ width: 16, height: 2, background: "#3388ff", flexShrink: 0 }} />
          <span style={{ color: "#444" }}>Jalur Kabel Fiber</span>
        </div>
      </div>
    </div>
  );
}