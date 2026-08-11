import { NextResponse } from "next/server";
import { createCheckout } from "@/lib/doku/client";

export async function GET() {
  try {
    const testOrderId = `TEST-${Date.now()}`;
    const result = await createCheckout({
      orderId: testOrderId,
      amount: 10000,
      itemName: "Voucher Test 1 Hari",
      customerName: "Test Pelanggan",
      customerEmail: "test@ionet.my.id",
      customerPhone: "+6281234567890",
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: (err as Error).message },
      { status: 500 }
    );
  }
}