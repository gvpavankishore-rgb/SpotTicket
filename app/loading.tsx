export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-64 rounded-3xl border border-white/[0.06] bg-surface sm:h-72" />

      <div className="mt-8 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-accent/20" />
          <div className="h-6 w-48 rounded bg-white/10" />
        </div>
        <div className="h-7 w-24 rounded-full bg-white/[0.06]" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="aspect-[2/3] rounded-2xl border border-white/[0.06] bg-surface" />
            <div className="h-4 w-3/4 rounded bg-white/10" />
            <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
