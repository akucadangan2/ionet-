import { NextResponse } from "next/server";
import { generateDynamicQris } from "@/lib/doku/client";

export async function GET() {
  try {
    const testOrderId = `TEST-${Date.now()}`;
    const result = await generateDynamicQris(testOrderId, 10000);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || String(err),
        debugSteps: err.debugSteps || err.debug || null,
      },
      { status: 500 }
    );
  }
}