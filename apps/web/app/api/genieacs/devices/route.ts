import { NextResponse } from "next/server";

const NBI_URL = process.env.GENIEACS_NBI_URL!;

export async function GET() {
  try {
    const res = await fetch(`${NBI_URL}/devices`, { cache: "no-store" });
    const devices = await res.json();

    const simplified = devices.map((d: any) => {
      const igd = d.InternetGatewayDevice || {};
      const wlan = igd.LANDevice?.["1"]?.WLANConfiguration?.["1"];
      const pppUser = igd.WANDevice?.["1"]?.WANConnectionDevice?.["2"]?.WANPPPConnection?.["1"];

      return {
        deviceId: d._id,
        manufacturer: d._deviceId?._Manufacturer,
        productClass: d._deviceId?._ProductClass,
        serialNumber: d._deviceId?._SerialNumber,
        ssid: wlan?.SSID?._value || null,
        pppoeUsername: pppUser?.Username?._value || null,
        externalIp: pppUser?.ExternalIPAddress?._value || null,
        lastInform: d._lastInform,
      };
    });

    return NextResponse.json({ devices: simplified });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}