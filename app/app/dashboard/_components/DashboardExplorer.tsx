"use client";

import { useMemo, useState } from "react";
import type { FifaMatch, MatchStatus } from "@/lib/fifa/types";
import { flagEmoji, formatMatchDay, matchDayKey } from "@/lib/fifa/format";
import {
  collectDays,
  collectNations,
  matchesQuery,
  SELECT_CLASS,
} from "@/lib/fifa/ui-utils";
import { MatchCard } from "@/app/matches/_components/MatchCard";
import { MatchStats } from "@/app/matches/_components/MatchStats";

const ALL = "all";

const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "Live",
  completed: "Completed",
  postponed: "Postponed",
  cancelled: "Cancelled",
};

/** Statuses actually present in the dataset, in canonical order. */
function collectStatuses(matches: FifaMatch[]): MatchStatus[] {
  const present = new Set(matches.map((m) => m.status));
  return (Object.keys(STATUS_LABELS) as MatchStatus[]).filter((s) =>
    present.has(s),
  );
}

export function DashboardExplorer({ matches }: { matches: FifaMatch[] }) {
  const [query, setQuery] = useState("");
  const [nationId, setNationId] = useState<string>(ALL);
  const [day, setDay] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);

  const nations = useMemo(() => collectNations(matches), [matches]);
  const days = useMemo(() => collectDays(matches), [matches]);
  const statuses = useMemo(() => collectStatuses(matches), [matches]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const id = nationId === ALL ? null : Number(nationId);
    return matches.filter((match) => {
      if (q && !matchesQuery(match, q)) return false;
      if (id !== null && match.home_team.id !== id && match.away_team.id !== id)
        return false;
      if (day !== ALL && matchDayKey(match.datetime) !== day) return false;
      if (status !== ALL && match.status !== status) return false;
      return true;
    });
  }, [matches, query, nationId, day, status]);

  const hasFilters =
    query.trim() !== "" || nationId !== ALL || day !== ALL || status !== ALL;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">Match explorer</h2>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-black/[.08] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-white/[.145] dark:bg-zinc-900">
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

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value={ALL}>All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Showing{" "}
          <strong className="text-zinc-700 dark:text-zinc-200">
            {filtered.length}
          </strong>{" "}
          of {matches.length} matches
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setNationId(ALL);
              setDay(ALL);
              setStatus(ALL);
            }}
            className="text-sm text-zinc-500 underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

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
    </section>
  );
}
