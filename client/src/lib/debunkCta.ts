export function trackDebunkCta(): void {
  try {
    void fetch("/api/rumors/cta", {
      method: "POST",
      keepalive: true,
      credentials: "include",
    }).catch(() => {});
  } catch {
    // ignore — tracking must never break navigation
  }
}
