export type TrailerSource =
  | {
      kind: "youtube";
      id: string;
      embedUrl: string;
      thumbnailUrl: string;
    }
  | {
      kind: "video";
      url: string;
    };

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
]);

function parseHttpUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^[a-z][a-z\d+\-.]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function getYouTubeId(url: URL) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const segments = url.pathname.split("/").filter(Boolean);
  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = segments[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (
      segments.length >= 2 &&
      ["embed", "shorts", "live", "v"].includes(segments[0])
    ) {
      candidate = segments[1];
    } else {
      candidate = url.searchParams.get("v");
    }
  }

  return candidate && YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
}

export function getTrailerSource(
  trailerUrl?: string | null,
): TrailerSource | null {
  if (!trailerUrl) {
    return null;
  }

  const url = parseHttpUrl(trailerUrl);

  if (!url) {
    return null;
  }

  const youtubeId = getYouTubeId(url);

  if (youtubeId) {
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      controls: "0",
      modestbranding: "1",
      rel: "0",
      playsinline: "1",
      enablejsapi: "1",
      loop: "1",
      playlist: youtubeId,
      iv_load_policy: "3",
    });

    return {
      kind: "youtube",
      id: youtubeId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }

  return {
    kind: "video",
    url: url.toString(),
  };
}
