"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface HeroSearchProps {
  placeholder?: string;
}

export default function HeroSearch({ placeholder }: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = query.trim();
    router.push(
      trimmed ? `/movies?search=${encodeURIComponent(trimmed)}` : "/movies",
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="relative flex h-14 w-full items-center gap-2 rounded-2xl border border-pink-300/15 bg-white/[0.055] pl-4 pr-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_20px_50px_-20px_rgba(190,18,60,0.45)] backdrop-blur-xl transition-all duration-300 focus-within:border-pink-400/50 focus-within:bg-white/[0.075] focus-within:shadow-[0_0_0_3px_rgba(236,72,153,0.12),0_20px_50px_-20px_rgba(190,18,60,0.55)] sm:h-16 sm:pl-5"
    >
      <Search
        className="h-4 w-4 shrink-0 text-pink-300/80 sm:h-[18px] sm:w-[18px]"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder ?? "Search for movies, cinemas..."}
        aria-label="Search for movies and cinemas"
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 sm:text-base"
      />
      <button
        type="submit"
        aria-label="Search movies and cinemas"
        className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-4 text-xs font-bold text-white shadow-[0_10px_30px_-10px_rgba(236,72,153,0.8)] transition-all duration-300 hover:from-rose-400 hover:to-fuchsia-400 hover:shadow-[0_12px_34px_-8px_rgba(236,72,153,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050307] active:scale-[0.97] sm:h-12 sm:px-6 sm:text-sm"
      >
        Search
      </button>
    </form>
  );
}
