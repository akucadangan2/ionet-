// app/api/test/wa/route.ts
// Endpoint sementara buat testing WA gateway - boleh dihapus nanti kalau udah nggak perlu
import { NextRequest, NextResponse } from "next/server";
import { sendWhatsApp } from "@/lib/wa-gateway/client";

export async function POST(req: NextRequest) {
  const { phone, message } = await req.json();

  try {
    const result = await sendWhatsApp(phone, message || "Test dari IONET+ 🚀");
    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json({ success: false, message: (err as Error).message }, { status: 500 });
  }
}