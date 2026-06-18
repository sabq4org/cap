// Fire-and-forget recorder for "تفنيد الشائعات" (debunk) CTA button clicks.
// Called from every entry-point button so the admin dashboard counter reflects
// real engagement regardless of which button or page the visitor used.
export function recordDebunkCtaClick() {
  // Prefer sendBeacon so the request survives the immediate navigation that
  // follows the click; fall back to fetch keepalive where unavailable.
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon("/api/analytics/debunk-cta", new Blob([], { type: "text/plain" }));
      if (ok) return;
    }
  } catch {}
  fetch("/api/analytics/debunk-cta", {
    method: "POST",
    credentials: "include",
    keepalive: true,
  }).catch(() => {});
}
