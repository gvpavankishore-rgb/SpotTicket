import type { ReactNode } from "react";
import { Film, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Film,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-surface px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
