import type { FifaMatch, FifaTeam, MatchStatus } from "@/lib/fifa/types";
import { flagEmoji, formatKickoff, scoreline } from "@/lib/fifa/format";

const STATUS_STYLES: Record<MatchStatus, { label: string; className: string }> = {
  scheduled: {
    label: "Scheduled",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  },
  in_progress: {
    label: "Live",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
  completed: {
    label: "Full time",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  postponed: {
    label: "Postponed",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-zinc-200 text-zinc-500 line-through dark:bg-zinc-800 dark:text-zinc-400",
  },
};

function StatusBadge({
  status,
  clock,
}: {
  status: MatchStatus;
  clock: string | null;
}) {
  const style = STATUS_STYLES[status];
  const isLive = status === "in_progress";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}
    >
      {isLive && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {isLive && clock ? clock : style.label}
    </span>
  );
}

function TeamSide({
  team,
  align = "left",
}: {
  team: FifaTeam;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <span className="text-2xl" aria-hidden>
        {flagEmoji(team.country_code)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{team.name}</p>
        <p className="text-xs text-zinc-500">{team.abbreviation}</p>
      </div>
    </div>
  );
}

export function MatchCard({ match }: { match: FifaMatch }) {
  const score = scoreline(match);
  const stageLabel = match.group
    ? `${match.stage.name} · Group ${match.group.name}`
    : match.stage.name;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-5 shadow-sm dark:border-white/[.145] dark:bg-zinc-900">
      <header className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500">{stageLabel}</span>
        <StatusBadge status={match.status} clock={match.clock_display} />
      </header>

      <div className="flex items-center justify-between gap-3">
        <TeamSide team={match.home_team} />
        <div className="shrink-0 text-center">
          {score ? (
            <span className="text-xl font-bold tabular-nums">{score}</span>
          ) : (
            <span className="text-sm font-medium text-zinc-400">vs</span>
          )}
        </div>
        <TeamSide team={match.away_team} align="right" />
      </div>

      <footer className="flex flex-col gap-1 border-t border-black/[.06] pt-3 text-xs text-zinc-500 dark:border-white/[.08]">
        <span>{formatKickoff(match.datetime)}</span>
        <span>
          {match.stadium.name} · {match.stadium.city}
        </span>
      </footer>
    </article>
  );
}
