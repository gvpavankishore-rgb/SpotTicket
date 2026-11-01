import { AlertCircle, CheckCircle2, Clock3, XCircle } from "lucide-react";

interface BookingStatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<
  string,
  { className: string; icon: typeof CheckCircle2 }
> = {
  confirmed: {
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    icon: CheckCircle2,
  },
  pending: {
    className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    icon: Clock3,
  },
  cancelled: {
    className: "border-zinc-500/25 bg-zinc-500/10 text-zinc-400",
    icon: XCircle,
  },
  failed: {
    className: "border-red-500/25 bg-red-500/10 text-red-400",
    icon: AlertCircle,
  },
};

function formatStatus(status: string) {
  return status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : "Unknown";
}

export default function BookingStatusBadge({
  status,
  className = "",
}: BookingStatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] ?? {
    className: "border-white/10 bg-white/[0.04] text-zinc-400",
    icon: Clock3,
  };
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${style.className} ${className}`}
    >
      <Icon className="h-2.5 w-2.5" />
      {formatStatus(status)}
    </span>
  );
}
