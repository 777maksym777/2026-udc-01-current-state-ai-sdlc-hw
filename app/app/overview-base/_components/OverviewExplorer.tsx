"use client";

import { useMemo, useState } from "react";
import type { FifaMatch, FifaTeam } from "@/lib/fifa/types";
import { flagEmoji, formatMatchDay, matchDayKey } from "@/lib/fifa/format";
import { MatchCard } from "@/app/matches/_components/MatchCard";
import { MatchStats } from "@/app/matches/_components/MatchStats";
import { MatchPredictor } from "./MatchPredictor";

const ALL = "all";

/** Distinct nations across both sides of every match, sorted by name. */
function collectNations(matches: FifaMatch[]): FifaTeam[] {
  const byId = new Map<number, FifaTeam>();
  for (const match of matches) {
    byId.set(match.home_team.id, match.home_team);
    byId.set(match.away_team.id, match.away_team);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Distinct UTC match days, sorted chronologically. */
function collectDays(matches: FifaMatch[]): string[] {
  const days = new Set<string>();
  for (const match of matches) days.add(matchDayKey(match.datetime));
  return [...days].sort();
}

function matchesQuery(match: FifaMatch, query: string): boolean {
  const haystack = [
    match.home_team.name,
    match.home_team.abbreviation,
    match.away_team.name,
    match.away_team.abbreviation,
    match.stadium.name,
    match.stadium.city,
    `#${match.match_number}`,
    String(match.match_number),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

const SELECT_CLASS =
  "w-full rounded-lg border border-black/[.12] bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-white/[.18] dark:bg-zinc-900";

export function OverviewExplorer({ matches }: { matches: FifaMatch[] }) {
  const [query, setQuery] = useState("");
  const [nationId, setNationId] = useState<string>(ALL);
  const [day, setDay] = useState<string>(ALL);

  const nations = useMemo(() => collectNations(matches), [matches]);
  const days = useMemo(() => collectDays(matches), [matches]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const id = nationId === ALL ? null : Number(nationId);
    return matches.filter((match) => {
      if (q && !matchesQuery(match, q)) return false;
      if (id !== null && match.home_team.id !== id && match.away_team.id !== id)
        return false;
      return !(day !== ALL && matchDayKey(match.datetime) !== day);

    });
  }, [matches, query, nationId, day]);

  const hasFilters = query.trim() !== "" || nationId !== ALL || day !== ALL;

  return (
    <div className="flex flex-col gap-8">
      <MatchPredictor matches={matches} />

      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-black/[.08] bg-white p-4 sm:grid-cols-3 dark:border-white/[.145] dark:bg-zinc-900">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500">Match</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Team, stadium, or #number"
              className={SELECT_CLASS}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500">Nation</span>
            <select
              value={nationId}
              onChange={(e) => setNationId(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value={ALL}>All nations</option>
              {nations.map((team) => (
                <option key={team.id} value={team.id}>
                  {flagEmoji(team.country_code)} {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500">Date</span>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value={ALL}>All dates</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {formatMatchDay(`${d}T00:00:00Z`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            Showing <strong className="text-zinc-700 dark:text-zinc-200">{filtered.length}</strong>{" "}
            of {matches.length} matches
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setNationId(ALL);
                setDay(ALL);
              }}
              className="text-sm text-zinc-500 underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      <MatchStats matches={filtered} />

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/[.12] p-8 text-center text-zinc-500 dark:border-white/[.18]">
          No matches fit these filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
