interface AdminPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <span className="h-px w-5 bg-accent" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          {eyebrow}
        </span>
      </div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
    </div>
  );
}
