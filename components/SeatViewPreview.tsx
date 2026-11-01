"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Armchair, Film, Volume2, VolumeX, X } from "lucide-react";
import { SEAT_ROWS, SEATS_PER_ROW } from "@/lib/seats";
import { getTrailerSource } from "@/lib/trailer";

interface SeatViewPreviewProps {
  seat: string;
  movieTitle: string;
  posterUrl?: string | null;
  trailerUrl?: string | null;
  onClose: () => void;
}

function getSeatMetrics(seat: string) {
  const match = /^([A-Z])(\d+)$/.exec(seat.toUpperCase());
  const rowIndex = match
    ? Math.max(0, (SEAT_ROWS as readonly string[]).indexOf(match[1]))
    : 0;
  const seatNumber = match
    ? Number(match[2])
    : Math.ceil(SEATS_PER_ROW / 2);
  const rowCount = SEAT_ROWS.length;
  const depth = rowCount > 1 ? rowIndex / (rowCount - 1) : 0;
  const maxOffset = (SEATS_PER_ROW - 1) / 2;
  const horizontal =
    maxOffset > 0
      ? (seatNumber - (SEATS_PER_ROW + 1) / 2) / maxOffset
      : 0;
  const clampedHorizontal = Math.max(-1, Math.min(1, horizontal));
  const rowBand =
    depth < 0.34 ? "Front row" : depth < 0.67 ? "Middle row" : "Back row";

  return {
    rowIndex,
    rowLabel: SEAT_ROWS[rowIndex] ?? seat.charAt(0),
    rowBand,
    depth,
    screenScale: 1.2 - depth * 0.55,
    screenBrightness: 1 - depth * 0.18,
    rotateX: 6 + depth * 2,
    rotateY: clampedHorizontal * -24,
    shiftX: clampedHorizontal * -6,
    shiftY: -8 + depth * 12,
    perspective: 650 + depth * 350,
  };
}

export default function SeatViewPreview({
  seat,
  movieTitle,
  posterUrl,
  trailerUrl,
  onClose,
}: SeatViewPreviewProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [isMuted, setIsMuted] = useState(true);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const metrics = useMemo(() => getSeatMetrics(seat), [seat]);
  const trailer = useMemo(() => getTrailerSource(trailerUrl), [trailerUrl]);
  const fallbackImage =
    posterUrl ||
    (trailer?.kind === "youtube" ? trailer.thumbnailUrl : null);
  const trailerVisible = Boolean(trailer) && !mediaFailed;

  useEffect(() => {
    setMediaReady(false);
    setMediaFailed(false);
    setIsMuted(true);
  }, [trailerUrl]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      video.muted = isMuted;
    }

    if (!mediaReady || trailer?.kind !== "youtube") {
      return;
    }

    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: isMuted ? "mute" : "unMute",
        args: [],
      }),
      "*",
    );
  }, [isMuted, mediaReady, trailer]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || trailer?.kind !== "video") {
      return;
    }

    video.muted = isMuted;
    void video.play().catch(() => {});
  }, [isMuted, trailer]);

  function handleYouTubeLoad() {
    setMediaReady(true);

    if (!isMutedRef.current) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "unMute", args: [] }),
        "*",
      );
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="seat-view-title"
      onClick={onClose}
      className="animate-seat-view-fade fixed inset-0 z-[60] flex items-end justify-center bg-black/85 backdrop-blur-md sm:items-center sm:p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="animate-seat-view-rise max-h-[calc(100dvh-0.5rem)] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0b0b0d] shadow-2xl shadow-black/80 sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-px w-5 bg-accent" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                View from seat
              </span>
            </div>
            <h2
              id="seat-view-title"
              className="mt-1.5 text-lg font-bold tracking-tight text-white sm:text-xl"
            >
              Seat {seat}
            </h2>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {movieTitle} · {metrics.rowBand}
            </p>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close seat preview"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition-colors hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mt-4 overflow-hidden border-y border-white/[0.06] bg-[#050507]">
          <div className="relative h-[270px] sm:h-[380px]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: [
                  "radial-gradient(ellipse 58% 52% at 50% 36%, rgba(245, 158, 11, 0.12), transparent 72%)",
                  "radial-gradient(ellipse 55% 45% at 50% 108%, rgba(245, 158, 11, 0.08), transparent 65%)",
                ].join(", "),
              }}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black/90 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black/90 to-transparent" />

            {trailerVisible && (
              <button
                type="button"
                onClick={() => setIsMuted((current) => !current)}
                aria-label={isMuted ? "Unmute trailer" : "Mute trailer"}
                aria-pressed={!isMuted}
                className="absolute right-2.5 top-2.5 z-30 inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-black/65 px-2.5 text-[9px] font-semibold text-white/85 shadow-lg shadow-black/40 backdrop-blur-md transition-colors hover:border-accent/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:right-4 sm:top-4 sm:h-9 sm:px-3 sm:text-[10px]"
              >
                {isMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                {isMuted ? "Unmute" : "Mute"}
              </button>
            )}

            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ perspective: `${metrics.perspective}px` }}
            >
              <div
                className="relative"
                style={{
                  width: "74%",
                  aspectRatio: "16 / 9",
                  transform: `translate(${metrics.shiftX}%, ${metrics.shiftY}%) rotateX(${metrics.rotateX}deg) rotateY(${metrics.rotateY}deg) scale(${metrics.screenScale})`,
                  transformStyle: "preserve-3d",
                  filter: `brightness(${metrics.screenBrightness})`,
                }}
              >
                <div className="absolute -inset-6 rounded-[45%] bg-accent/10 blur-2xl" />

                <div className="relative h-full w-full overflow-hidden rounded-[3px] border border-white/15 bg-black shadow-[0_0_65px_-6px_rgba(245,158,11,0.4)]">
                  <div className="absolute inset-0">
                    {fallbackImage ? (
                      <Image
                        src={fallbackImage}
                        alt={`${movieTitle} poster`}
                        fill
                        sizes="(max-width: 640px) 74vw, 560px"
                        unoptimized
                        className="scale-105 object-cover opacity-45 blur-[1.5px]"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: [
                            "radial-gradient(circle at 26% 24%, rgba(251, 191, 36, 0.45), transparent 38%)",
                            "radial-gradient(circle at 78% 70%, rgba(56, 189, 248, 0.22), transparent 42%)",
                            "linear-gradient(155deg, #1e293b 0%, #0b1220 48%, #020617 100%)",
                          ].join(", "),
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/45" />
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "radial-gradient(ellipse at 50% 120%, rgba(245, 158, 11, 0.2), transparent 62%)",
                      }}
                    />

                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-5 text-center">
                      <span className="rounded-full border border-white/10 bg-black/35 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[0.28em] text-white/55">
                        {mediaFailed
                          ? "Trailer unavailable"
                          : trailer
                            ? "Loading trailer"
                            : "Now showing"}
                      </span>
                      <span
                        className="line-clamp-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/95 sm:text-sm"
                        style={{ textShadow: "0 1px 14px rgba(0,0,0,0.85)" }}
                      >
                        {movieTitle}
                      </span>
                      <span className="max-w-[230px] text-[7px] leading-relaxed text-white/50 sm:text-[9px]">
                        {mediaFailed
                          ? "The trailer could not be loaded. Enjoy the seat preview."
                          : trailer
                            ? "Preparing your cinema preview..."
                            : "No trailer is available for this movie."}
                      </span>
                    </div>
                  </div>

                  {trailerVisible && trailer?.kind === "youtube" && (
                    <iframe
                      ref={iframeRef}
                      src={trailer.embedUrl}
                      title={`${movieTitle} trailer`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      onLoad={handleYouTubeLoad}
                      onError={() => {
                        setMediaReady(false);
                        setMediaFailed(true);
                      }}
                      className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${
                        mediaReady ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  )}

                  {trailerVisible && trailer?.kind === "video" && (
                    <video
                      ref={videoRef}
                      src={trailer.url}
                      poster={posterUrl ?? undefined}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      onCanPlay={() => setMediaReady(true)}
                      onPlaying={() => setMediaReady(true)}
                      onError={() => {
                        setMediaReady(false);
                        setMediaFailed(true);
                      }}
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                        mediaReady ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  )}

                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[6%] bg-black/80" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[6%] bg-black/80" />
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-4 -bottom-4 flex items-end justify-center gap-1 sm:gap-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 flex-1 rounded-t-[1.4rem] border-t border-white/[0.06] bg-gradient-to-b from-zinc-800/80 to-black sm:h-14"
                  style={{
                    transform: `translateY(${index % 2 === 0 ? 0 : 6}px)`,
                  }}
                />
              ))}
            </div>

            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_24px_rgba(0,0,0,0.68)]" />
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
              <Armchair className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-relaxed text-white sm:text-sm">
                This is how the movie will look from your seat.
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Film className="h-3 w-3 shrink-0 text-accent/70" />
                Seat {seat} · {metrics.rowBand} perspective · {metrics.rowLabel}{" "}
                row
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
