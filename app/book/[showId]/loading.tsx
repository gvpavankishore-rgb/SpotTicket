export default function BookSeatLoading() {
  return (
    <div className="animate-pulse pb-4">
      <div className="h-3 w-28 rounded bg-white/10" />
      <div className="mt-4 h-3 w-16 rounded bg-accent/20" />
      <div className="mt-3 h-8 w-56 rounded bg-white/10" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-white/[0.06]" />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-2xl border border-white/[0.06] bg-surface"
          />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-surface p-4 sm:p-6">
        <div className="h-5 w-36 rounded bg-white/10" />
        <div className="mx-auto mt-6 h-1.5 w-full max-w-md rounded-full bg-accent/20" />
        <div className="mx-auto mt-3 h-3 w-16 rounded bg-white/[0.06]" />

        <div className="mt-8 space-y-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1.5">
              {Array.from({ length: 12 }).map((_, seatIndex) => (
                <div
                  key={seatIndex}
                  className="h-8 w-8 rounded-md bg-white/[0.06] sm:h-9 sm:w-9"
                />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-6 h-28 rounded-xl border border-white/[0.06] bg-black/20" />
      </div>
    </div>
  );
}
