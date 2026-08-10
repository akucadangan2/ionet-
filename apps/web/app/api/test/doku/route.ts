// app/api/test/doku/route.ts
// Endpoint sementara buat testing checkout DOKU - boleh dihapus nanti kalau udah nggak perlu
import { NextResponse } from "next/server";
import { createCheckout } from "@/lib/doku/client";

export async function GET() {
  try {
    const testOrderId = `TEST-${Date.now()}`;
    const result = await createCheckout({
      orderId: testOrderId,
      amount: 10000, // Rp10.000, nominal kecil buat testing
      paymentMethod: "QRIS",
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: (err as Error).message },
      { status: 500 }
    );
  }
}