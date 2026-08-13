// app/api/webhooks/doku/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { processPaymentSuccess } from "@/lib/payment/process-payment";

const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY!;

function verifyWebhookSignature(params: {
  clientId: string;
  requestId: string;
  timestamp: string;
  bodyString: string;
  receivedSignature: string;
}) {
  const digest = crypto.createHash("sha256").update(params.bodyString).digest("base64");
  const componentSignature =
    `Client-Id:${params.clientId}\n` +
    `Request-Id:${params.requestId}\n` +
    `Request-Timestamp:${params.timestamp}\n` +
    `Request-Target:/api/webhooks/doku\n` +
    `Digest:${digest}`;
  const expectedSignature = `HMACSHA256=${crypto
    .createHmac("sha256", DOKU_SECRET_KEY)
    .update(componentSignature)
    .digest("base64")}`;
  return expectedSignature === params.receivedSignature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const clientId = req.headers.get("client-id") ?? "";
  const requestId = req.headers.get("request-id") ?? "";
  const timestamp = req.headers.get("request-timestamp") ?? "";
  const receivedSignature = req.headers.get("signature") ?? "";

  const isValid = verifyWebhookSignature({
    clientId,
    requestId,
    timestamp,
    bodyString: rawBody,
    receivedSignature,
  });

  if (!isValid) {
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