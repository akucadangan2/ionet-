// lib/doku/client.ts
import crypto from "crypto";

const DOKU_BASE_URL = process.env.DOKU_BASE_URL!;
const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID!;
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY!;

interface CheckoutParams {
  orderId: string;      // reference unik per transaksi (voucher atau langganan bulanan)
  amount: number;
  paymentMethod: "QRIS" | "VIRTUAL_ACCOUNT";
}

interface CheckoutResult {
  orderId: string;
  qrString?: string;      // buat QRIS
  vaNumber?: string;      // buat VA
  expiredAt: string;
}

// Generate signature sesuai spesifikasi DOKU (HMAC-SHA256 berbasis request body + timestamp)
function generateSignature(
  clientId: string,
  requestId: string,
  timestamp: string,
  requestTarget: string,
  body: string
) {
  const digest = crypto.createHash("sha256").update(body).digest("base64");
  const componentSignature =
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${timestamp}\n` +
    `Request-Target:${requestTarget}\n` +
    `Digest:${digest}`;

  const signature = crypto
    .createHmac("sha256", DOKU_SECRET_KEY)
    .update(componentSignature)
    .digest("base64");

  return { signature: `HMACSHA256=${signature}`, digest };
}

export async function createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
  const requestTarget = "/checkout/v1/payment";
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const body = JSON.stringify({
    order: {
      invoice_number: params.orderId,
      amount: params.amount,
    },
    payment: {
      payment_due_date: 15, // menit
      payment_method_types: [params.paymentMethod],
    },
  });

  const { signature, digest } = generateSignature(
    DOKU_CLIENT_ID,
    requestId,
    timestamp,
    requestTarget,
    body
  );

  const res = await fetch(`${DOKU_BASE_URL}${requestTarget}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": DOKU_CLIENT_ID,
      "Request-Id": requestId,
      "Request-Timestamp": timestamp,
      "Signature": signature,
      "Digest": digest,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`DOKU checkout gagal: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  return {
    orderId: params.orderId,
    qrString: json?.payment?.url ?? json?.qris?.qr_string,
    vaNumber: json?.virtual_account_info?.va_number,
    expiredAt: json?.payment?.expired_date,
  };
}

// Dipanggil dari poller (fallback kalau webhook DOKU tidak fire, lesson dari Maesa Mart)
export async function checkStatus(orderId: string) {
  const requestTarget = `/orders/v1/status/${orderId}`;
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const { signature, digest } = generateSignature(
    DOKU_CLIENT_ID,
    requestId,
    timestamp,
    requestTarget,
    ""
  );

  const res = await fetch(`${DOKU_BASE_URL}${requestTarget}`, {
    method: "GET",
    headers: {
      "Client-Id": DOKU_CLIENT_ID,
      "Request-Id": requestId,
      "Request-Timestamp": timestamp,
      "Signature": signature,
      "Digest": digest,
    },
  });

  if (!res.ok) {
    throw new Error(`DOKU check status gagal: ${res.status} ${await res.text()}`);
  }

  return res.json();
}