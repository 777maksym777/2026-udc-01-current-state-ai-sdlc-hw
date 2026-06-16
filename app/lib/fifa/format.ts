import type { FifaMatch } from "./types";

// Fixed locale + UTC keeps server-rendered output deterministic (no hydration drift).
const KICKOFF_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

export function formatKickoff(iso: string): string {
  return KICKOFF_FORMAT.format(new Date(iso));
}

// Day-only label (UTC) for grouping/filtering matches by calendar date.
const MATCH_DAY_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** The UTC calendar day of a kickoff, e.g. "2026-06-11" — a stable filter key. */
export function matchDayKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Human-readable UTC day label, e.g. "Thu, 11 Jun 2026". */
export function formatMatchDay(iso: string): string {
  return MATCH_DAY_FORMAT.format(new Date(iso));
}

/** ISO-3166 alpha-2 country code -> regional-indicator flag emoji. */
export function flagEmoji(countryCode: string): string {
  const cc = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "\u{1F3F3}\u{FE0F}"; // white flag fallback
  const BASE = 0x1f1e6; // regional indicator "A"
  return String.fromCodePoint(
    BASE + (cc.charCodeAt(0) - 65),
    BASE + (cc.charCodeAt(1) - 65),
  );
}

/** Scoreline (with penalties when present), or null when no score yet. */
export function scoreline(match: FifaMatch): string | null {
  if (match.home_score === null || match.away_score === null) return null;
  const base = `${match.home_score}–${match.away_score}`;
  if (
    match.home_score_penalties !== null &&
    match.away_score_penalties !== null
  ) {
    return `${base} (${match.home_score_penalties}–${match.away_score_penalties} pens)`;
  }
  return base;
}
