import { storage } from "./storage";

/** Hard caps — Asia/Riyadh calendar day. */
export const RADAR_DAILY_FETCH_LIMIT = 2;
export const RADAR_DAILY_EDIT_LIMIT = 10;

export class RadarQuotaError extends Error {
  status = 429;
  code: "FETCH_LIMIT" | "EDIT_LIMIT";

  constructor(code: "FETCH_LIMIT" | "EDIT_LIMIT", message: string) {
    super(message);
    this.name = "RadarQuotaError";
    this.code = code;
  }
}

export function getRiyadhDayKey(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
}

export type RadarQuotaSnapshot = {
  day: string;
  fetchesUsed: number;
  fetchesLimit: number;
  fetchesRemaining: number;
  editsUsed: number;
  editsLimit: number;
  editsRemaining: number;
};

export async function getRadarQuotaSnapshot(): Promise<RadarQuotaSnapshot> {
  const day = getRiyadhDayKey();
  const usage = await storage.getRadarDailyUsage(day);
  const fetchesUsed = usage?.fetchesUsed ?? 0;
  const editsUsed = usage?.editsUsed ?? 0;
  return {
    day,
    fetchesUsed,
    fetchesLimit: RADAR_DAILY_FETCH_LIMIT,
    fetchesRemaining: Math.max(0, RADAR_DAILY_FETCH_LIMIT - fetchesUsed),
    editsUsed,
    editsLimit: RADAR_DAILY_EDIT_LIMIT,
    editsRemaining: Math.max(0, RADAR_DAILY_EDIT_LIMIT - editsUsed),
  };
}

export async function assertCanFetch(): Promise<RadarQuotaSnapshot> {
  const snap = await getRadarQuotaSnapshot();
  if (snap.fetchesRemaining <= 0) {
    throw new RadarQuotaError(
      "FETCH_LIMIT",
      `تم بلوغ حد الجلب اليومي (${RADAR_DAILY_FETCH_LIMIT} مرات). حاول غداً.`,
    );
  }
  return snap;
}

export async function recordFetch(): Promise<RadarQuotaSnapshot> {
  const day = getRiyadhDayKey();
  await storage.incrementRadarDailyUsage(day, { fetches: 1 });
  return getRadarQuotaSnapshot();
}

/** Throws if fewer than `needed` edit slots remain. */
export async function assertCanEdit(needed: number = 1): Promise<RadarQuotaSnapshot> {
  const snap = await getRadarQuotaSnapshot();
  if (needed < 1) return snap;
  if (snap.editsRemaining < needed) {
    throw new RadarQuotaError(
      "EDIT_LIMIT",
      snap.editsRemaining === 0
        ? `تم بلوغ حد التحرير اليومي (${RADAR_DAILY_EDIT_LIMIT} أخبار). حاول غداً.`
        : `متبقي ${snap.editsRemaining} فقط من حد التحرير اليومي (${RADAR_DAILY_EDIT_LIMIT}).`,
    );
  }
  return snap;
}

export async function recordEdits(count: number): Promise<RadarQuotaSnapshot> {
  if (count <= 0) return getRadarQuotaSnapshot();
  const day = getRiyadhDayKey();
  await storage.incrementRadarDailyUsage(day, { edits: count });
  return getRadarQuotaSnapshot();
}
