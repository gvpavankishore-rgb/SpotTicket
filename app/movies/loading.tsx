export default function MoviesLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-16 rounded bg-accent/20" />
      <div className="mt-3 h-8 w-56 rounded bg-white/10" />
      <div className="mt-3 h-4 w-72 max-w-full rounded bg-white/[0.06]" />
      <div className="mt-6 h-32 rounded-2xl border border-white/[0.06] bg-surface" />

      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
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
