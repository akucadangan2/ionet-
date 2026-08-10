// components/NetworkMap.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function makeIcon(color: string) {
  return new L.DivIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.15)"></div>`,
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
}

interface NetworkMapProps {
  routers: RouterPin[];
  pelanggan: PelangganPin[];
  center: [number, number];
}

export default function NetworkMap({ routers, pelanggan, center }: NetworkMapProps) {
  return (
    <MapContainer center={center} zoom={15} style={{ height: "600px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {routers.map((r) => (
        <Marker
          key={r.id}
          position={[r.latitude, r.longitude]}
          icon={r.status === "online" ? iconOnline : iconOffline}
        >
          <Popup>
            <b>{r.nama}</b>
            <br />
            Status: <span style={{ color: r.status === "online" ? "#2FAE60" : "#D64545", fontWeight: 600 }}>
              {r.status}
            </span>
          </Popup>
        </Marker>
      ))}

      {pelanggan.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={p.status === "aktif" ? iconOnline : iconOffline}
        >
          <Popup>
            <b>{p.nama}</b>
            <br />
            Status: {p.status}
            {p.rxPower !== undefined && (
              <>
                <br />
                Rx: {p.rxPower} dBm &middot; Tx: {p.txPower} dBm
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}