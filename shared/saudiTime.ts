export const SAUDI_TIME_ZONE = "Asia/Riyadh";
export const SAUDI_UTC_OFFSET = "+03:00";

const EXPLICIT_TIME_ZONE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;
const SAUDI_LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;

/**
 * Parse an instant sent by the editor.
 *
 * - ISO strings with Z/an offset are already absolute and remain unchanged.
 * - datetime-local strings have no timezone, so they are explicitly treated
 *   as Saudi time instead of inheriting the browser or server timezone.
 */
export function parseSaudiDateTime(value: string | Date | null | undefined): Date | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? new Date(value.getTime()) : null;
  }
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  let normalized = trimmed.replace(" ", "T");
  if (!EXPLICIT_TIME_ZONE.test(normalized)) {
    if (!SAUDI_LOCAL_DATE_TIME.test(trimmed)) return null;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
      normalized += ":00";
    }
    normalized += SAUDI_UTC_OFFSET;
  }

  const parsed = new Date(normalized);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

/** Convert a Saudi datetime-local field value into an absolute UTC ISO value. */
export function saudiInputToUtcIso(value: string): string {
  const parsed = parseSaudiDateTime(value);
  return parsed ? parsed.toISOString() : "";
}

function saudiDateParts(value: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAUDI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(
    formatter.formatToParts(value).map((part) => [part.type, part.value]),
  );
}

/** Convert an absolute instant into a datetime-local value displayed in Riyadh. */
export function utcIsoToSaudiInput(value: string | Date): string {
  const parsed = parseSaudiDateTime(value);
  if (!parsed) return "";
  const parts = saudiDateParts(parsed);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Current Riyadh wall-clock value for datetime-local min/default fields. */
export function getSaudiNowInput(now: Date = new Date()): string {
  return utcIsoToSaudiInput(now);
}
