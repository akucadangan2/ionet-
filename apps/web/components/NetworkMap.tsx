// components/NetworkMap.tsx
"use client";
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function makeIcon(color: string) {
  return new L.DivIcon({
    className: "",
    html: '<div style="width:16px;height:16px;border-radius:50%;background:' + color + ';border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.15)"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const iconOnline = makeIcon("#2FAE60");
const iconOffline = makeIcon("#D64545");

const iconHijau = makeIcon("#2FAE60");
const iconKuning = makeIcon("#E8B923");
const iconBiru = makeIcon("#3B82F6");
const iconMerah = makeIcon("#D64545");
const iconAbu = makeIcon("#9CA3AF");
const iconDefault = makeIcon("#6B7280");

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

interface NetworkMapProps {
  routers: RouterPin[];
  pelanggan: PelangganPin[];
  titikJaringan?: TitikJaringanPin[];
  center: [number, number];
}

const iconOdc = new L.DivIcon({
  className: "",
  html: '<div style="width:14px;height:14px;background:#8B5CF6;border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.15);transform:rotate(45deg)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const iconOdp = new L.DivIcon({
  className: "",
  html: '<div style="width:12px;height:12px;background:#F59E0B;border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.15);transform:rotate(45deg)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

export default function NetworkMap({ routers, pelanggan, titikJaringan, center }: NetworkMapProps) {
  return (
    <MapContainer center={center} zoom={15} style={{ height: "600px", width: "100%" }}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Peta Jalan">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satelit">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {routers.map(function (r) {
        return (
          <Marker key={r.id} position={[r.latitude, r.longitude]} icon={r.status === "online" ? iconOnline : iconOffline}>
            <Popup>
              <b>{r.nama}</b>
              <br />
              Status:{" "}
              <span style={{ color: r.status === "online" ? "#2FAE60" : "#D64545", fontWeight: 600 }}>
                {r.status}
              </span>
            </Popup>
          </Marker>
        );
      })}

      {pelanggan.map(function (p) {
        const cleanDeskripsi = p.kmlDeskripsi ? stripHtmlTags(p.kmlDeskripsi) : "";
        return (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={getIconByKategori(p.kmlKategori)}>
            <Popup>
              <div style={{ minWidth: 200, maxWidth: 260 }}>
                <b>{p.nama}</b>
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
                    Rx: {p.rxPower} dBm{p.txPower !== undefined && p.txPower !== null ? " \u00b7 Tx: " + p.txPower + " dBm" : ""}
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
      {(titikJaringan || []).map(function (t) {
        return (
          <Marker key={t.id} position={[t.latitude, t.longitude]} icon={t.tipe === "odc" ? iconOdc : iconOdp}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <b>{t.nama}</b>
                <br />
                Tipe: {t.tipe.toUpperCase()}
                {t.kapasitas_port && (
                  <>
                    <br />
                    Port: {t.port_terpakai || 0}/{t.kapasitas_port}
                  </>
                )}
                {t.keterangan && (
                  <>
                    <hr style={{ margin: "6px 0" }} />
                    <div style={{ fontSize: 11 }}>{t.keterangan}</div>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}