import type { FifaMatch } from "@/lib/fifa/types";

export function MatchStats({ matches }: { matches: FifaMatch[] }) {
  const tiles = [
    { label: "Matches", value: matches.length },
    {
      label: "Live",
      value: matches.filter((m) => m.status === "in_progress").length,
    },
    {
      label: "Completed",
      value: matches.filter((m) => m.status === "completed").length,
    },
    {
      label: "Upcoming",
      value: matches.filter((m) => m.status === "scheduled").length,
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-900"
        >
          <dt className="text-xs uppercase tracking-wide text-zinc-500">
            {tile.label}
          </dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {tile.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
