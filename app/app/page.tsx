import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 px-8 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50">
            FIFA World Cup 2026
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Browse matches, read team standings, and run match predictions.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            href="/matches"
          >
            View Matches →
          </Link>
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-6 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            href="/overview-base"
          >
            Overview & Predictions
          </Link>
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-6 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            href="/dashboard"
          >
            Advanced Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
