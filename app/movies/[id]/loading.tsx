export default function MovieDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-20 rounded bg-white/10" />

      <div className="mt-4 rounded-3xl border border-white/[0.06] bg-surface p-5 sm:p-6 lg:p-8">
        <div className="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <div className="mx-auto aspect-[2/3] w-full max-w-[220px] rounded-2xl bg-white/[0.04] md:mx-0 md:max-w-none" />
          <div className="space-y-4">
            <div className="h-6 w-28 rounded-full bg-accent/15" />
            <div className="h-9 w-3/4 rounded bg-white/10" />
            <div className="flex gap-2">
              <div className="h-7 w-24 rounded-full bg-white/[0.06]" />
              <div className="h-7 w-20 rounded-full bg-white/[0.06]" />
              <div className="h-7 w-20 rounded-full bg-white/[0.06]" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded bg-white/[0.06]" />
              <div className="h-4 w-11/12 rounded bg-white/[0.06]" />
              <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        <div className="h-3 w-24 rounded bg-accent/20" />
        <div className="h-7 w-48 rounded bg-white/10" />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-44 rounded-2xl border border-white/[0.06] bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
