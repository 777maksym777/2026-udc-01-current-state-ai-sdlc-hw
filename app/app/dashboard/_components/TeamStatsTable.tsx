"use client";

import { useMemo, useState } from "react";
import type { FifaMatch } from "@/lib/fifa/types";
import { flagEmoji } from "@/lib/fifa/format";
import { buildForm, type TeamForm } from "@/lib/fifa/predict";

/** A team's form augmented with the derived points and goal-difference columns. */
interface TeamRow extends TeamForm {
  points: number;
  goalDiff: number;
}

type SortKey =
  | "points"
  | "played"
  | "wins"
  | "draws"
  | "losses"
  | "goalsFor"
  | "goalsAgainst"
  | "goalDiff";

const COLUMNS: { key: SortKey; label: string; title: string }[] = [
  { key: "played", label: "P", title: "Played" },
  { key: "wins", label: "W", title: "Wins" },
  { key: "draws", label: "D", title: "Draws" },
  { key: "losses", label: "L", title: "Losses" },
  { key: "goalsFor", label: "GF", title: "Goals for" },
  { key: "goalsAgainst", label: "GA", title: "Goals against" },
  { key: "goalDiff", label: "GD", title: "Goal difference" },
  { key: "points", label: "Pts", title: "Points (3·W + D)" },
];

function toRows(matches: FifaMatch[]): TeamRow[] {
  return [...buildForm(matches).values()].map((form) => ({
    ...form,
    points: form.wins * 3 + form.draws,
    goalDiff: form.goalsFor - form.goalsAgainst,
  }));
}

/** Default standings order: points, then goal difference, then goals scored, then name. */
function compareDefault(a: TeamRow, b: TeamRow): number {
  return (
    b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor ||
    a.team.name.localeCompare(b.team.name)
  );
}

export function TeamStatsTable({ matches }: { matches: FifaMatch[] }) {
  const rows = useMemo(() => toRows(matches), [matches]);
  const [sortKey, setSortKey] = useState<SortKey>("points");

  const sorted = useMemo(() => {
    return [...rows].sort(
      (a, b) => b[sortKey] - a[sortKey] || compareDefault(a, b),
    );
  }, [rows, sortKey]);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-5 shadow-sm dark:border-white/[.145] dark:bg-zinc-900">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Team standings</h2>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
          From completed matches
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/[.08] text-zinc-500 dark:border-white/[.145]">
              <th className="px-2 py-2 text-left font-medium">Team</th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-1 py-2 text-right font-medium"
                  aria-sort={sortKey === col.key ? "descending" : "none"}
                >
                  <button
                    type="button"
                    title={`Sort by ${col.title}`}
                    onClick={() => setSortKey(col.key)}
                    className={`tabular-nums underline-offset-2 hover:underline ${
                      sortKey === col.key
                        ? "font-semibold text-zinc-900 dark:text-zinc-100"
                        : ""
                    }`}
                  >
                    {col.label}
                    {sortKey === col.key ? " ↓" : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.team.id}
                className="border-b border-black/[.04] last:border-0 dark:border-white/[.06]"
              >
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-right text-xs text-zinc-400 tabular-nums">
                      {i + 1}
                    </span>
                    <span aria-hidden>{flagEmoji(row.team.country_code)}</span>
                    <span className="truncate font-medium">{row.team.name}</span>
                    <span className="text-xs text-zinc-400">
                      {row.team.abbreviation}
                    </span>
                  </div>
                </td>
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`px-1 py-2 text-right tabular-nums ${
                      col.key === "points"
                        ? "font-semibold"
                        : "text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-400">
        Click a column to re-sort. Standings reflect every completed match in the
        dataset and are unaffected by the filters below.
      </p>
    </section>
  );
}
