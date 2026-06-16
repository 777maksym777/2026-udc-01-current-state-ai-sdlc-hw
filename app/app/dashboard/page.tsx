import type { Metadata } from "next";
import Link from "next/link";
import { CURRENT_SEASON, getWorldCupMatches } from "@/lib/fifa/client";
import { MatchPredictor } from "@/app/overview-base/_components/MatchPredictor";
import { TeamStatsTable } from "@/app/dashboard/_components/TeamStatsTable";
import { DashboardExplorer } from "@/app/dashboard/_components/DashboardExplorer";

export const metadata: Metadata = {
  title: "World Cup Dashboard",
  description:
    "Advanced FIFA World Cup dashboard: forecast fixtures, read team standings, and filter matches by team, date, and status.",
};

export default async function DashboardPage() {
  const { matches, source } = await getWorldCupMatches();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="mb-8 flex flex-col gap-1">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Dashboard {CURRENT_SEASON}
        </h1>
        <p className="text-zinc-500">
          Forecast a fixture, read the standings, and filter the match list.
        </p>
      </div>

      {source === "sample" && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Showing <strong>demo data</strong>. Set{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
            BALLDONTLIE_API_KEY
          </code>{" "}
          in <code>app/.env.local</code> to load live matches.
        </div>
      )}

      <div className="flex flex-col gap-8">
        <MatchPredictor matches={matches} />
        <TeamStatsTable matches={matches} />
        <DashboardExplorer matches={matches} />
      </div>
    </main>
  );
}
