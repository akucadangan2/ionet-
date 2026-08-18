import { NextRequest, NextResponse } from "next/server";

const NBI_URL = process.env.GENIEACS_NBI_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, ssid, password } = body;

    if (!deviceId) {
      return NextResponse.json({ message: "deviceId diperlukan" }, { status: 400 });
    }

    const parameterValues = [];
    if (ssid) {
      parameterValues.push([
        "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID",
        ssid,
        "xsd:string",
      ]);
    }
    if (password) {
      parameterValues.push([
        "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase",
        password,
        "xsd:string",
      ]);
    }

    if (parameterValues.length === 0) {
      return NextResponse.json({ message: "Isi SSID atau password dulu" }, { status: 400 });
    }

    const res = await fetch(`${NBI_URL}/devices/${encodeURIComponent(deviceId)}/tasks?connection_request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "setParameterValues",
        parameterValues,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      return NextResponse.json({ message: "Gagal update, task tetap tersimpan dan akan diterapkan saat modem lapor berikutnya", detail: result });
    }

    return NextResponse.json({ message: "Berhasil dikirim ke modem", detail: result });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}