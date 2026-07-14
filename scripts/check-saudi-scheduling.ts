import assert from "node:assert/strict";
import {
  getSaudiNowInput,
  parseSaudiDateTime,
  saudiInputToUtcIso,
  utcIsoToSaudiInput,
} from "../shared/saudiTime";

const saudiInput = "2026-07-14T09:30";
const expectedUtc = "2026-07-14T06:30:00.000Z";

assert.equal(saudiInputToUtcIso(saudiInput), expectedUtc);
assert.equal(utcIsoToSaudiInput(expectedUtc), saudiInput);
assert.equal(parseSaudiDateTime(expectedUtc)?.toISOString(), expectedUtc);
assert.equal(parseSaudiDateTime("2026-07-14T09:30:00+03:00")?.toISOString(), expectedUtc);
assert.equal(getSaudiNowInput(new Date(expectedUtc)), saudiInput);

const scheduled = parseSaudiDateTime(saudiInput);
assert.ok(scheduled);
assert.equal(scheduled.getTime(), Date.UTC(2026, 6, 14, 6, 30));
assert.equal(scheduled.getTime() <= Date.UTC(2026, 6, 14, 6, 29), false);
assert.equal(scheduled.getTime() <= Date.UTC(2026, 6, 14, 6, 30), true);

console.log("Saudi scheduling checks passed: 09:30 Riyadh = 06:30 UTC");
