// lib/doku/client.ts
import crypto from "crypto";

const DOKU_BASE_URL = process.env.DOKU_BASE_URL!;
const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID!;
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY!;

interface CheckoutParams {
  orderId: string;
  amount: number;
  itemName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

interface CheckoutResult {
  orderId: string;
  qrString?: string;
  vaNumber?: string;
  paymentUrl?: string;
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
      amount: params.amount,
      invoice_number: params.orderId,
      currency: "IDR",
      session_id: params.orderId,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/voucher`,
      line_items: [
        { name: params.itemName, price: params.amount, quantity: 1 },
      ],
    },
    payment: {
      payment_due_date: 15,
    },
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
      country: "ID",
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
    paymentUrl: json?.payment?.url,
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

// ===== DOKU Direct API (SNAP) - QRIS Dinamis, kita bangun sendiri tampilannya =====
const DOKU_PRIVATE_KEY = process.env.DOKU_PRIVATE_KEY!;

function toIsoStringNoMs(date: Date): string {
  return date.toISOString().split(".")[0] + "Z";
}

export interface SnapDebugInfo {
  step: string;
  requestUrl: string;
  requestHeaders: Record<string, string>;
  requestBody: string;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
}

async function getSnapAccessToken(): Promise<{ token: string; debug: SnapDebugInfo }> {
  const timestamp = toIsoStringNoMs(new Date());
  const stringToSign = `${DOKU_CLIENT_ID}|${timestamp}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(stringToSign);
  sign.end();
  const signature = sign.sign(DOKU_PRIVATE_KEY, "base64");

  const url = `${DOKU_BASE_URL}/authorization/v1/access-token/b2b`;
  const headers = {
    "Content-Type": "application/json",
    "X-CLIENT-KEY": DOKU_CLIENT_ID,
    "X-TIMESTAMP": timestamp,
    "X-SIGNATURE": signature,
  };
  const bodyStr = JSON.stringify({ grantType: "client_credentials" });

  const res = await fetch(url, { method: "POST", headers, body: bodyStr });
  const responseText = await res.text();

  const debug: SnapDebugInfo = {
    step: "1. Get Access Token",
    requestUrl: url,
    requestHeaders: { ...headers, "X-SIGNATURE": signature.slice(0, 20) + "...(dipotong)" },
    requestBody: bodyStr,
    responseStatus: res.status,
    responseHeaders: Object.fromEntries(res.headers.entries()),
    responseBody: responseText,
  };

  if (!res.ok) {
    throw { message: "Gagal ambil access token", debug };
  }

  const json = JSON.parse(responseText);
  return { token: json.accessToken, debug };
}

export async function generateDynamicQris(
  orderId: string,
  amount: number
): Promise<{ qrString: string; expiredAt: string; debugSteps: SnapDebugInfo[] }> {
  const debugSteps: SnapDebugInfo[] = [];

  const { token: accessToken, debug: tokenDebug } = await getSnapAccessToken();
  debugSteps.push(tokenDebug);

  const requestTarget = "/snap-adapter/b2b/v1.0/qr/qr-mpm-generate";
  const timestamp = toIsoStringNoMs(new Date());

  const body = {
    partnerReferenceNo: orderId,
    amount: { value: amount.toFixed(2), currency: "IDR" },
    merchantId: "ID1026555054018",
    terminalId: "A01",
  };
  const bodyStr = JSON.stringify(body);

  const bodyHash = crypto.createHash("sha256").update(bodyStr).digest("hex").toLowerCase();
  const stringToSign = `POST:${requestTarget}:${accessToken}:${bodyHash}:${timestamp}`;
  const signature = crypto.createHmac("sha512", DOKU_SECRET_KEY).update(stringToSign).digest("base64");

  const url = `${DOKU_BASE_URL}${requestTarget}`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
    "X-PARTNER-ID": DOKU_CLIENT_ID,
    "X-EXTERNAL-ID": orderId,
    "X-TIMESTAMP": timestamp,
    "X-SIGNATURE": signature,
    "CHANNEL-ID": "95221",
  };

  const res = await fetch(url, { method: "POST", headers, body: bodyStr });
  const responseText = await res.text();

  const genDebug: SnapDebugInfo = {
    step: "2. Generate QRIS",
    requestUrl: url,
    requestHeaders: {
      ...headers,
      "Authorization": headers.Authorization.slice(0, 30) + "...(dipotong)",
      "X-SIGNATURE": signature.slice(0, 20) + "...(dipotong)",
    },
    requestBody: bodyStr,
    responseStatus: res.status,
    responseHeaders: Object.fromEntries(res.headers.entries()),
    responseBody: responseText,
  };
  debugSteps.push(genDebug);

  if (!res.ok) {
    throw { message: "Gagal generate QRIS", debugSteps };
  }

  const json = JSON.parse(responseText);
  return {
    qrString: json.qrContent,
    expiredAt: json.validityPeriod,
    debugSteps,
  };
}