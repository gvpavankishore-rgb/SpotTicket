import type { ReactNode } from "react";

interface SectionHeadingProps {
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  action,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tabular-nums text-accent/50">
            {index}
          </span>
          <span className="h-px w-8 bg-gradient-to-r from-accent/80 to-transparent" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
            {eyebrow}
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
