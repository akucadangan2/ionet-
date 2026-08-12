// components/NetworkMap.tsx
"use client";
import { useState } from "react";
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

interface NetworkMapProps {
  routers: RouterPin[];
  pelanggan: PelangganPin[];
  center: [number, number];
}

export default function NetworkMap({ routers, pelanggan, center }: NetworkMapProps) {
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
        return (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={p.status === "aktif" ? iconOnline : iconOffline}>
            <Popup>
              <div style={{ minWidth: 180 }}>
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
                    Rx: {p.rxPower} dBm {p.txPower !== undefined ? "\u00b7 Tx: " + p.txPower + " dBm" : ""}
                  </>
                )}
                {p.kmlDeskripsi && (
                  <>
                    <hr style={{ margin: "6px 0" }} />
                    <div style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{p.kmlDeskripsi}</div>
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