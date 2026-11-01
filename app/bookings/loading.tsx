export default function BookingsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-accent/20" />
          <div className="h-8 w-44 rounded bg-white/10" />
          <div className="h-4 w-72 max-w-full rounded bg-white/[0.06]" />
        </div>
        <div className="h-7 w-24 rounded-full bg-white/[0.06]" />
      </div>

      <div className="mt-6 grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-white/[0.06] bg-surface"
          >
            <div className="grid sm:grid-cols-[minmax(0,1fr)_180px]">
              <div className="p-4 sm:p-5">
                <div className="flex gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-white/[0.06]" />
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="h-4 w-2/3 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
                    <div className="h-3 w-40 max-w-full rounded bg-white/[0.06]" />
                    <div className="h-5 w-28 rounded bg-accent/10" />
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.06] p-4 sm:border-l sm:border-t-0 sm:p-5">
                <div className="h-3 w-16 rounded bg-white/[0.06]" />
                <div className="mt-2 h-5 w-20 rounded bg-white/10" />
                <div className="mt-4 h-9 w-full rounded-lg bg-white/[0.06]" />
              </div>
            </div>

            <div className="border-t border-white/[0.06] bg-black/20 px-4 py-3 sm:px-5">
              <div className="h-3 w-full max-w-sm rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
