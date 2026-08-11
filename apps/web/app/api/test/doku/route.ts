import { NextResponse } from "next/server";
import { generateDynamicQris } from "@/lib/doku/client";

export async function GET() {
  try {
    const testOrderId = `TEST-${Date.now()}`;
    const result = await generateDynamicQris(testOrderId, 10000);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: (err as Error).message },
      { status: 500 }
    );
  }
}