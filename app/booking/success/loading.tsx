export default function BookingSuccessLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      <div className="flex flex-col items-center">
        <div className="h-16 w-16 rounded-2xl border border-white/[0.06] bg-surface" />
        <div className="mt-4 h-3 w-32 rounded bg-accent/20" />
        <div className="mt-3 h-8 w-56 max-w-full rounded bg-white/10" />
        <div className="mt-3 h-4 w-72 max-w-full rounded bg-white/[0.06]" />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/[0.06] bg-surface">
        <div className="flex items-start gap-4 p-5 pt-6 sm:p-6 sm:pt-7">
          <div className="h-28 w-20 shrink-0 rounded-xl bg-white/[0.04] sm:h-32 sm:w-24" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-3 w-28 rounded bg-accent/20" />
            <div className="h-6 w-2/3 rounded bg-white/10" />
            <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
          </div>
        </div>

        <div className="border-y border-white/[0.06] bg-black/10 px-5 py-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-16 rounded bg-white/[0.06]" />
                <div className="h-4 w-20 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          <div className="h-3 w-24 rounded bg-accent/20" />
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-6 w-10 rounded bg-white/[0.06]" />
            ))}
          </div>
        </div>

        <div className="space-y-2 border-t border-white/[0.06] bg-black/20 p-5 sm:p-6">
          <div className="h-3 w-full max-w-md rounded bg-white/[0.06]" />
          <div className="h-3 w-4/5 max-w-sm rounded bg-white/[0.06]" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-11 rounded-xl bg-white/[0.06]" />
        ))}
      </div>
    </div>
  );
}
