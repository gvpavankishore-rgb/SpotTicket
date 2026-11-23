import Image from "next/image";
import { UserRound, UsersRound } from "lucide-react";
import type { CastMember, CastRole } from "@/lib/cast";

interface MovieCastProps {
  members: CastMember[];
}

const roleClasses: Record<CastRole, string> = {
  Director: "border-accent/25 bg-accent/10 text-accent",
  Actor: "border-pink-400/25 bg-pink-500/10 text-pink-300",
  Producer: "border-rose-300/20 bg-rose-400/10 text-rose-200",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function MovieCast({ members }: MovieCastProps) {
  if (members.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 sm:mt-10" aria-labelledby="cast-crew-heading">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
            <UsersRound className="h-4 w-4" />
          </span>
          <div>
            <h2
              id="cast-crew-heading"
              className="text-base font-semibold text-white sm:text-lg"
            >
              Cast &amp; Crew
            </h2>
            <p className="text-[11px] text-zinc-500">
              The people behind the magic
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
          {members.length} {members.length === 1 ? "person" : "people"}
        </span>
      </div>

      <ul className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory scroll-smooth gap-3 overflow-x-auto px-4 pb-2 scroll-px-4 sm:mx-0 sm:px-0">
        {members.map((member) => (
          <li
            key={member.id}
            className="w-[104px] shrink-0 snap-start sm:w-[124px]"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#1c1709] via-surface to-[#0b0b0b] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow">
              {member.photo_url ? (
                <Image
                  src={member.photo_url}
                  alt={member.name}
                  fill
                  sizes="(max-width: 640px) 104px, 124px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
                  <UserRound
                    className="h-6 w-6 text-accent/60"
                    strokeWidth={1.5}
                  />
                  <span className="text-[10px] font-semibold tracking-wide text-zinc-500">
                    {getInitials(member.name)}
                  </span>
                </div>
              )}
            </div>
            <p
              className="mt-2 truncate text-xs font-semibold text-white"
              title={member.name}
            >
              {member.name}
            </p>
            <span
              className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                roleClasses[member.role] ?? roleClasses.Actor
              }`}
            >
              {member.role}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-600 sm:hidden">
        Swipe to see the full cast <span aria-hidden="true">→</span>
      </p>
    </section>
  );
}
