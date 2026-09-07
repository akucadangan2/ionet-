// app/api/admin/force-complete-payment/route.ts
// Endpoint darurat: paksa selesaikan transaksi yang sudah sukses di DOKU tapi
// gagal ke-follow-up otomatis (webhook gagal + terlewat jendela waktu cron
// check-pending-payments). Dipakai manual sesekali, bukan dipanggil rutin.
import { NextRequest, NextResponse } from "next/server";
import { processPaymentSuccess } from "@/lib/payment/process-payment";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ message: "orderId diperlukan" }, { status: 400 });
    }
    const result = await processPaymentSuccess(orderId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}