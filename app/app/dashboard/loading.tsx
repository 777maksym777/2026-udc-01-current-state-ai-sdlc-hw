export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="mb-8 h-9 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-col gap-8">
        <div className="h-56 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-72 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
