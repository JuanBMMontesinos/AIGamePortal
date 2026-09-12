export default function Loading() {
  return (
    <div className="w-full py-8 space-y-10 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[480px] w-full rounded-3xl bg-zinc-200 dark:bg-gamer-900 border border-zinc-200 dark:border-gamer-800" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-80 rounded-2xl bg-zinc-200 dark:bg-gamer-900 border border-zinc-200 dark:border-gamer-800"
            />
          ))}
        </div>
        <div className="lg:col-span-4 h-96 rounded-2xl bg-zinc-200 dark:bg-gamer-900 border border-zinc-200 dark:border-gamer-800" />
      </div>
    </div>
  );
}
