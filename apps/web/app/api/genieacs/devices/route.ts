import { NextResponse } from "next/server";

const NBI_URL = process.env.GENIEACS_NBI_URL!;

export async function GET() {
  try {
    const res = await fetch(`${NBI_URL}/devices`, { cache: "no-store" });
    const devices = await res.json();

    function findPppoeInfo(device: any): { username: string | null; externalIp: string | null } {
      const igd = device.InternetGatewayDevice || {};
      const wan = igd.WANDevice || {};
      for (const wanKey in wan) {
        if (wanKey.startsWith("_")) continue;
        const wcd = wan[wanKey].WANConnectionDevice || {};
        for (const wcdKey in wcd) {
          if (wcdKey.startsWith("_")) continue;
          const ppp = wcd[wcdKey].WANPPPConnection || {};
          for (const pppKey in ppp) {
            if (pppKey.startsWith("_")) continue;
            const conn = ppp[pppKey];
            const uname = conn.Username?._value;
            if (uname) {
              return { username: uname, externalIp: conn.ExternalIPAddress?._value || null };
            }
          }
        }
      }
      return { username: null, externalIp: null };
    }

    function findSsid(device: any): string | null {
      const igd = device.InternetGatewayDevice || {};
      const lan = igd.LANDevice || {};
      for (const lanKey in lan) {
        if (lanKey.startsWith("_")) continue;
        const wlanConf = lan[lanKey].WLANConfiguration || {};
        for (const wlanKey in wlanConf) {
          if (wlanKey.startsWith("_")) continue;
          const ssid = wlanConf[wlanKey].SSID?._value;
          if (ssid) return ssid;
        }
      }
      return null;
    }

    const simplified = devices.map((d: any) => {
      const pppInfo = findPppoeInfo(d);

      return {
        deviceId: d._id,
        manufacturer: d._deviceId?._Manufacturer,
        productClass: d._deviceId?._ProductClass,
        serialNumber: d._deviceId?._SerialNumber,
        ssid: findSsid(d),
        pppoeUsername: pppInfo.username,
        externalIp: pppInfo.externalIp,
        lastInform: d._lastInform,
      };
    });

    return NextResponse.json({ devices: simplified });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}