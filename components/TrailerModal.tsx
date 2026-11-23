"use client";

import { useEffect } from "react";
import { ExternalLink, Play, X } from "lucide-react";

interface TrailerModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

function normalizeYouTubeId(value: string | null) {
  return value && /^[A-Za-z0-9_-]{6,}$/.test(value) ? value : null;
}

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return normalizeYouTubeId(parsed.pathname.split("/").filter(Boolean)[0]);
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return normalizeYouTubeId(parsed.pathname.split("/")[2]);
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        return normalizeYouTubeId(parsed.pathname.split("/")[2]);
      }

      if (parsed.pathname.startsWith("/live/")) {
        return normalizeYouTubeId(parsed.pathname.split("/")[2]);
      }

      return normalizeYouTubeId(parsed.searchParams.get("v"));
    }

    return null;
  } catch {
    return null;
  }
}

function getVimeoId(url: string) {
  try {
    const parsed = new URL(url);

    if (!parsed.hostname.includes("vimeo.com")) {
      return null;
    }

    const id = parsed.pathname.split("/").filter(Boolean).pop();

    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function getEmbedUrl(url: string) {
  const youtubeId = getYouTubeId(url);

  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
  }

  const vimeoId = getVimeoId(url);

  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
  }

  return url;
}

function isVideoFile(url: string) {
  return /\.(mp4|webm|ogg|ogv|mov)([?#].*)?$/i.test(url);
}

export default function TrailerModal({
  url,
  title,
  onClose,
}: TrailerModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} trailer`}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl shadow-black/80"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                Now playing
              </p>
              <h2 className="truncate text-sm font-semibold text-white">
                {title} · Trailer
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close trailer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-accent/40 hover:text-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="aspect-video w-full bg-black">
          {isVideoFile(url) ? (
            <video
              src={url}
              controls
              autoPlay
              playsInline
              className="h-full w-full"
            />
          ) : (
            <iframe
              src={getEmbedUrl(url)}
              title={`${title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-zinc-500">
          <span>Tap outside or press Esc to close</span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-zinc-400 transition-colors hover:text-accent"
          >
            Open in new tab
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
