// Server-only data client for the BALLDONTLIE FIFA World Cup API.
// Never add "use client" here and never import it from a client component:
// it reads the secret API key from the server environment.

import { SAMPLE_MATCHES } from "./sample-data";
import type { FifaMatch, FifaMatchesResponse } from "./types";

const API_BASE = "https://api.balldontlie.io/fifa/worldcup/v1";

export const CURRENT_SEASON = 2026;

export type MatchesSource = "live" | "sample";

export interface MatchesResult {
  matches: FifaMatch[];
  source: MatchesSource;
}

function sortByKickoff(matches: FifaMatch[]): FifaMatch[] {
  // ISO 8601 UTC strings sort chronologically as plain strings.
  return [...matches].sort((a, b) => a.datetime.localeCompare(b.datetime));
}

const sampleResult = (): MatchesResult => ({
  matches: sortByKickoff(SAMPLE_MATCHES),
  source: "sample",
});

/**
 * Fetch FIFA World Cup matches for a season. Falls back to bundled sample data
 * when the API key is missing or the request fails, so the UI always renders.
 * Pagination beyond the first 100 results is intentionally not followed.
 */
export async function getWorldCupMatches(
  season: number = CURRENT_SEASON,
): Promise<MatchesResult> {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (!apiKey) return sampleResult();

  try {
    const url = new URL(`${API_BASE}/matches`);
    url.searchParams.append("seasons[]", String(season));
    url.searchParams.set("per_page", "100");

    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      next: { revalidate: 300 }, // cache live data for 5 minutes
    });

    if (!res.ok) return sampleResult();

    const body = (await res.json()) as FifaMatchesResponse;
    return { matches: sortByKickoff(body.data), source: "live" };
  } catch {
    return sampleResult();
  }
}
