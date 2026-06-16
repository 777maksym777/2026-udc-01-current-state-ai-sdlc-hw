"use client";

import { useMemo, useState } from "react";
import type { FifaMatch, FifaTeam } from "@/lib/fifa/types";
import { flagEmoji } from "@/lib/fifa/format";
import { buildForm, predictMatch } from "@/lib/fifa/predict";

function collectNations(matches: FifaMatch[]): FifaTeam[] {
  const byId = new Map<number, FifaTeam>();
  for (const match of matches) {
    byId.set(match.home_team.id, match.home_team);
    byId.set(match.away_team.id, match.away_team);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const pct = (value: number) => `${Math.round(value * 100)}%`;

const SELECT_CLASS =
  "w-full rounded-lg border border-black/[.12] bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-white/[.18] dark:bg-zinc-900";

function TeamSelect({
  label,
  value,
  exclude,
  teams,
  onChange,
}: {
  label: string;
  value: number | null;
  exclude: number | null;
  teams: FifaTeam[];
  onChange: (id: number) => void;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className={SELECT_CLASS}
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id} disabled={team.id === exclude}>
            {flagEmoji(team.country_code)} {team.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MatchPredictor({ matches }: { matches: FifaMatch[] }) {
  const teams = useMemo(() => collectNations(matches), [matches]);
  const form = useMemo(() => buildForm(matches), [matches]);

  const [homeId, setHomeId] = useState<number | null>(teams[0]?.id ?? null);
  const [awayId, setAwayId] = useState<number | null>(teams[1]?.id ?? null);

  const homeTeam = teams.find((t) => t.id === homeId) ?? null;
  const awayTeam = teams.find((t) => t.id === awayId) ?? null;

  const prediction = useMemo(() => {
    if (homeId === null || awayId === null || homeId === awayId) return null;
    return predictMatch(homeId, awayId, form, matches);
  }, [homeId, awayId, form, matches]);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-5 shadow-sm dark:border-white/[.145] dark:bg-zinc-900">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Match predictor</h2>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
          Demo model
        </span>
      </header>

      <div className="flex flex-col items-end gap-3 sm:flex-row">
        <TeamSelect
          label="Home"
          value={homeId}
          exclude={awayId}
          teams={teams}
          onChange={setHomeId}
        />
        <span className="pb-2 text-sm font-medium text-zinc-400">vs</span>
        <TeamSelect
          label="Away"
          value={awayId}
          exclude={homeId}
          teams={teams}
          onChange={setAwayId}
        />
      </div>

      {prediction && homeTeam && awayTeam ? (
        <div className="flex flex-col gap-4 border-t border-black/[.06] pt-4 dark:border-white/[.08]">
          <div className="flex items-center justify-center gap-3 text-center">
            <span className="text-sm font-semibold">
              {flagEmoji(homeTeam.country_code)} {homeTeam.abbreviation}
            </span>
            <span className="text-2xl font-bold tabular-nums">
              {prediction.scoreHome}–{prediction.scoreAway}
            </span>
            <span className="text-sm font-semibold">
              {awayTeam.abbreviation} {flagEmoji(awayTeam.country_code)}
            </span>
          </div>

          <div className="flex h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="bg-emerald-500"
              style={{ width: pct(prediction.homeWin) }}
              aria-hidden
            />
            <div
              className="bg-zinc-400"
              style={{ width: pct(prediction.draw) }}
              aria-hidden
            />
            <div
              className="bg-sky-500"
              style={{ width: pct(prediction.awayWin) }}
              aria-hidden
            />
          </div>

          <dl className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <dt className="text-xs text-zinc-500">{homeTeam.abbreviation} win</dt>
              <dd className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {pct(prediction.homeWin)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Draw</dt>
              <dd className="font-semibold tabular-nums text-zinc-500">
                {pct(prediction.draw)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">{awayTeam.abbreviation} win</dt>
              <dd className="font-semibold tabular-nums text-sky-600 dark:text-sky-400">
                {pct(prediction.awayWin)}
              </dd>
            </div>
          </dl>

          <p className="text-center text-xs text-zinc-400">
            Estimated from goals in completed matches. For fun, not forecasting.
          </p>
        </div>
      ) : (
        <p className="border-t border-black/[.06] pt-4 text-center text-sm text-zinc-500 dark:border-white/[.08]">
          Pick two different teams to see a prediction.
        </p>
      )}
    </section>
  );
}
