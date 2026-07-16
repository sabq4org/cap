/**
 * Google Indexing API — optional, env-gated.
 * Uses a service-account JWT (no googleapis dependency).
 *
 * Env:
 *   GOOGLE_INDEXING_CLIENT_EMAIL
 *   GOOGLE_INDEXING_PRIVATE_KEY
 */

import crypto from "crypto";
import { getCanonicalOrigin } from "../seo";

const INDEXING_API_ENDPOINT =
  "https://indexing.googleapis.com/v3/urlNotifications:publish";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

interface IndexingResult {
  success: boolean;
  url: string;
  error?: string;
  notificationType?: string;
}

interface LastIndexEvent {
  url: string;
  success: boolean;
  at: string;
  error?: string;
  status?: number;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;
let isConfigured = false;
let lastEvent: LastIndexEvent | null = null;
let successCount = 0;
let failCount = 0;

function recordEvent(e: LastIndexEvent) {
  lastEvent = e;
  if (e.success) successCount++;
  else failCount++;
}

export function normalizePrivateKey(raw: string): string {
  let key = (raw || "").trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  key = key
    .replace(/\\\\n/g, "\n")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  if (!key.endsWith("\n")) key += "\n";
  return key;
}

export function describePrivateKeyShape(
  raw: string | undefined,
): Record<string, unknown> {
  if (!raw) return { present: false };
  const norm = normalizePrivateKey(raw);
  return {
    present: true,
    rawLength: raw.length,
    normalizedLength: norm.length,
    hasBeginHeader: norm.includes("-----BEGIN PRIVATE KEY-----"),
    hasEndHeader: norm.includes("-----END PRIVATE KEY-----"),
    isPkcs1Rsa: norm.includes("-----BEGIN RSA PRIVATE KEY-----"),
    realNewlines: (norm.match(/\n/g) || []).length,
    hadLiteralBackslashN: /\\n/.test(raw),
  };
}

function base64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function credentialsPresent(): boolean {
  return !!(
    process.env.GOOGLE_INDEXING_CLIENT_EMAIL?.trim() &&
    process.env.GOOGLE_INDEXING_PRIVATE_KEY?.trim()
  );
}

async function getAccessToken(): Promise<string | null> {
  if (!credentialsPresent()) return null;

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL!.trim();
  const privateKey = normalizePrivateKey(process.env.GOOGLE_INDEXING_PRIVATE_KEY!);

  if (!privateKey.includes("-----BEGIN") || !privateKey.includes("-----END")) {
    console.error(
      "[Google Indexing] Private key does not look like a PEM. Shape:",
      describePrivateKeyShape(process.env.GOOGLE_INDEXING_PRIVATE_KEY),
    );
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  let signature: string;
  try {
    signature = base64url(signer.sign(privateKey));
  } catch (err) {
    console.error("[Google Indexing] Failed to sign JWT:", err);
    return null;
  }
  const jwt = `${unsigned}.${signature}`;

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[Google Indexing] Token exchange failed ${res.status}: ${body.slice(0, 200)}`,
      );
      return null;
    }
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!data.access_token) return null;
    isConfigured = true;
    cachedAccessToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };
    return data.access_token;
  } catch (err) {
    console.error("[Google Indexing] Token request error:", err);
    return null;
  }
}

export function isGoogleIndexingConfigured(): boolean {
  if (isConfigured) return true;
  return credentialsPresent();
}

async function publishNotification(
  url: string,
  type: "URL_UPDATED" | "URL_DELETED",
): Promise<IndexingResult> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, url, error: "Google Indexing API not configured" };
  }

  try {
    const response = await fetch(INDEXING_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, type }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      const error =
        errorData.error?.message || `HTTP ${response.status}`;
      console.error(`[Google Indexing] Failed for ${url}:`, error);
      recordEvent({
        url,
        success: false,
        at: new Date().toISOString(),
        error,
        status: response.status,
      });
      return { success: false, url, error };
    }

    console.log(`[Google Indexing] ✅ ${type}: ${url}`);
    recordEvent({
      url,
      success: true,
      at: new Date().toISOString(),
      status: 200,
    });
    return { success: true, url, notificationType: type };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    recordEvent({
      url,
      success: false,
      at: new Date().toISOString(),
      error: message,
    });
    return { success: false, url, error: message };
  }
}

export async function notifyUrlUpdated(url: string): Promise<IndexingResult> {
  return publishNotification(url, "URL_UPDATED");
}

export async function notifyUrlDeleted(url: string): Promise<IndexingResult> {
  return publishNotification(url, "URL_DELETED");
}

export function getIndexingDiagnostics() {
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL || "";
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY;
  const maskedEmail = clientEmail
    ? clientEmail.replace(/^(.{2}).*?(@.*)$/, "$1***$2")
    : null;
  return {
    configured: isGoogleIndexingConfigured(),
    clientEmailPresent: !!clientEmail,
    clientEmail: maskedEmail,
    privateKey: describePrivateKeyShape(privateKey),
    baseUrl: getCanonicalOrigin(),
    indexNowKeyPresent: !!(process.env.INDEXNOW_KEY || "").trim(),
    stats: { success: successCount, failed: failCount },
    lastEvent,
  };
}
