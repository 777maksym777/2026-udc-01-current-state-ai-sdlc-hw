import type { Metadata } from "next";
import Link from "next/link";
import { CURRENT_SEASON, getWorldCupMatches } from "@/lib/fifa/client";
import { MatchCard } from "@/app/matches/_components/MatchCard";
import { MatchStats } from "@/app/matches/_components/MatchStats";

export const metadata: Metadata = {
  title: "FIFA World Cup Matches",
  description: "Live, completed, and upcoming FIFA World Cup matches.",
};

export default async function MatchesPage() {
  const { matches, source } = await getWorldCupMatches();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="mb-8 flex flex-col gap-1">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          FIFA World Cup {CURRENT_SEASON}
        </h1>
        <p className="text-zinc-500">
          Matches dashboard ·{" "}
          <Link href="/overview-base" className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-300">
            Overview & predictions →
          </Link>
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

      <div className="mb-8">
        <MatchStats matches={matches} />
      </div>

      {matches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/[.12] p-8 text-center text-zinc-500 dark:border-white/[.18]">
          No matches found for this season yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </main>
  );
}
