// app/api/webhooks/doku/route.ts (versi ringkas setelah refactor)
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { processPaymentSuccess } from "@/lib/payment/process-payment";

const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY!;

function verifyWebhookSignature(rawBody: string, receivedSignature: string, timestamp: string, requestId: string) {
  const digest = crypto.createHash("sha256").update(rawBody).digest("base64");
  const componentSignature =
    `Client-Id:${process.env.DOKU_CLIENT_ID}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${timestamp}\n` +
    `Request-Target:/webhooks/doku\n` +
    `Digest:${digest}`;

  const expectedSignature = `HMACSHA256=${crypto
    .createHmac("sha256", DOKU_SECRET_KEY)
    .update(componentSignature)
    .digest("base64")}`;

  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(receivedSignature));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("signature") ?? "";
  const timestamp = req.headers.get("request-timestamp") ?? "";
  const requestId = req.headers.get("request-id") ?? "";

  if (!verifyWebhookSignature(rawBody, signature, timestamp, requestId)) {
    return NextResponse.json({ message: "invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const orderId: string = payload?.order?.invoice_number;
  const status: string = payload?.transaction?.status;

  if (status !== "SUCCESS") {
    return NextResponse.json({ message: "ignored, status bukan SUCCESS" });
  }

  const result = await processPaymentSuccess(orderId);
  return NextResponse.json(result);
}